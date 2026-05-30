/**
 * PDF Processing Service
 * Handles all PDF operations with security in mind
 *
 * IMPORTANT: Uses overlay approach because pdf-lib cannot modify content streams
 * This is the ONLY way to edit PDFs 100% locally without a server
 *
 * Alternative: See ALTERNATIVES_PDF_LIB.md for other options
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PDFMetadata, PDFEditOperation } from '$lib/types/pdf.types';

/** Parse a hex color string (#rrggbb) into pdf-lib rgb() values (0–1 range) */
function hexToRgb(hex: string): ReturnType<typeof rgb> {
	const clean = hex.replace('#', '');
	const r = parseInt(clean.substring(0, 2), 16) / 255;
	const g = parseInt(clean.substring(2, 4), 16) / 255;
	const b = parseInt(clean.substring(4, 6), 16) / 255;
	return rgb(r, g, b);
}

/**
 * Loads and parses a PDF file
 * @param arrayBuffer - PDF file data
 * @returns PDF document instance
 */
export async function loadPDF(arrayBuffer: ArrayBuffer): Promise<PDFDocument> {
	try {
		const pdfDoc = await PDFDocument.load(arrayBuffer, {
			ignoreEncryption: false, // Respect encryption
			throwOnInvalidObject: true, // Fail on corrupted objects
			updateMetadata: false // Don't modify metadata on load
		});
		return pdfDoc;
	} catch (error) {
		throw new Error(
			`Impossible de charger le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}

/**
 * Extracts metadata from a PDF document
 * @param pdfDoc - PDF document instance
 * @returns PDF metadata
 */
export async function extractMetadata(pdfDoc: PDFDocument): Promise<PDFMetadata> {
	const pageCount = pdfDoc.getPageCount();
	const title = pdfDoc.getTitle();
	const author = pdfDoc.getAuthor();
	const subject = pdfDoc.getSubject();
	const creator = pdfDoc.getCreator();
	const producer = pdfDoc.getProducer();
	const creationDate = pdfDoc.getCreationDate();
	const modificationDate = pdfDoc.getModificationDate();

	return {
		pageCount,
		title: title || undefined,
		author: author || undefined,
		subject: subject || undefined,
		creator: creator || undefined,
		producer: producer || undefined,
		creationDate: creationDate || undefined,
		modificationDate: modificationDate || undefined
	};
}

/**
 * Edits text in a PDF document
 * Uses overlay approach (drawing white rectangles + new text)
 *
 * Why overlay? Because pdf-lib cannot modify existing content streams.
 * This keeps the solution 100% local and secure.
 *
 * @param pdfDoc - PDF document instance
 * @param operations - Array of edit operations
 * @returns Modified PDF document
 */
export async function editPDFText(
	pdfDoc: PDFDocument,
	operations: PDFEditOperation[]
): Promise<PDFDocument> {
	try {
		console.log('🔧 Applying', operations.length, 'edit operations to PDF');

		// Load default font
		const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

		for (const operation of operations) {
			console.log('📝 Processing operation:', operation.type, 'on page', operation.pageNumber);

			if (operation.pageNumber < 1 || operation.pageNumber > pdfDoc.getPageCount()) {
				throw new Error(`Numéro de page invalide: ${operation.pageNumber}`);
			}

			const page = pdfDoc.getPage(operation.pageNumber - 1);
			const { height } = page.getSize();

			switch (operation.type) {
				case 'text-add': {
					if (!operation.position) {
						throw new Error('Position requise pour ajouter du texte');
					}

					const fontSize = operation.fontSize || 12;
					const text = operation.newText;

					console.log('  ➕ Adding text:', text, 'at', operation.position);

					// Draw text at specified position (already in PDF coordinates)
					page.drawText(text, {
						x: operation.position.x,
						y: operation.position.y,
						size: fontSize,
						font: font,
						color: rgb(0, 0, 0)
					});
					break;
				}

				case 'text-edit': {
					// For editing, we first need to "erase" the old text (draw white rectangle)
					// then draw new text with better precision
					if (!operation.position) {
						throw new Error('Position requise pour éditer du texte');
					}

					const fontSize = operation.fontSize || 12;
					const text = operation.newText;

					// Calculate text width more accurately
					const textWidth = font.widthOfTextAtSize(text, fontSize);
					const oldTextWidth = operation.originalText
						? font.widthOfTextAtSize(operation.originalText, fontSize)
						: textWidth;

					// Position in PDF coordinates (y is already bottom-up from extraction)
					const x = operation.position.x;
					const y = operation.position.y;

					console.log('  ✏️ Editing text:', operation.originalText, '→', text, 'at', operation.position);
					console.log('     Font size:', fontSize, 'Text widths:', oldTextWidth, '→', textWidth);

					// Draw white rectangle to "erase" old text
					// Text baseline is at y, but text extends above (ascent) and below (descent)
					// Most fonts: ascent ≈ 0.85 * fontSize, descent ≈ 0.15 * fontSize
					const descent = fontSize * 0.15;
					const ascent = fontSize * 0.85;
					const rectHeight = ascent + descent + 4; // Extra padding
					const rectY = y - descent - 2; // Start below baseline

					page.drawRectangle({
						x: x - 2,
						y: rectY,
						width: Math.max(oldTextWidth, textWidth) + 6,
						height: rectHeight,
						color: hexToRgb(operation.eraserColor ?? '#ffffff'),
						borderWidth: 0
					});

					// Draw new text at baseline
					page.drawText(text, {
						x: x,
						y: y,
						size: fontSize,
						font: font,
						color: rgb(0, 0, 0)
					});
					break;
				}

				case 'text-delete': {
					// Draw white rectangle to "erase" text
					if (!operation.position) {
						throw new Error('Position requise pour supprimer du texte');
					}

					const fontSize = operation.fontSize || 12;
					const textWidth = operation.originalText
						? font.widthOfTextAtSize(operation.originalText, fontSize)
						: Math.max(200, (operation.originalText?.length || 10) * fontSize * 0.6);

					console.log('  🗑️ Deleting text:', operation.originalText, 'at', operation.position);

					// Same positioning logic as text-edit
					const descent = fontSize * 0.15;
					const ascent = fontSize * 0.85;
					const rectHeight = ascent + descent + 4;
					const rectY = operation.position.y - descent - 2;

					page.drawRectangle({
						x: operation.position.x - 2,
						y: rectY,
						width: textWidth + 6,
						height: rectHeight,
						color: hexToRgb(operation.eraserColor ?? '#ffffff'),
						borderWidth: 0
					});
					break;
				}
			}
		}

		console.log('✅ All operations applied successfully');
		return pdfDoc;
	} catch (error) {
		console.error('❌ Error applying edits:', error);
		throw new Error(
			`Erreur lors de l'édition du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}

/**
 * Saves a PDF document to bytes
 * @param pdfDoc - PDF document instance
 * @returns PDF bytes
 */
export async function savePDF(pdfDoc: PDFDocument): Promise<Uint8Array> {
	try {
		return await pdfDoc.save();
	} catch (error) {
		throw new Error(
			`Erreur lors de la sauvegarde du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}

/**
 * Downloads a PDF file to the user's computer
 * @param pdfBytes - PDF data
 * @param filename - Desired filename
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
	const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
