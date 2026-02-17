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
					// Rectangle positioned slightly above baseline to cover text
					page.drawRectangle({
						x: x - 1,
						y: y - 2, // Slightly below baseline
						width: Math.max(oldTextWidth, textWidth) + 4,
						height: fontSize + 4,
						color: rgb(1, 1, 1),
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
						: Math.max(200, (operation.originalText?.length || 10) * fontSize * 0.55);

					console.log('  🗑️ Deleting text:', operation.originalText, 'at', operation.position);

					page.drawRectangle({
						x: operation.position.x - 1,
						y: operation.position.y - 2,
						width: textWidth + 4,
						height: fontSize + 4,
						color: rgb(1, 1, 1),
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
	const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
