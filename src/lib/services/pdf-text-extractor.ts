/**
 * PDF Text Extraction Service
 * Extracts text with positions for interactive editing
 */

import { browser } from '$app/environment';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
	if (!browser) {
		throw new Error('PDF.js can only be used in browser context');
	}
	
	if (!pdfjsLib) {
		pdfjsLib = await import('pdfjs-dist');
		pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
	}
	
	return pdfjsLib;
}

export interface TextItem {
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	fontSize: number;
	fontName: string;
	transform: number[];
}

/**
 * Extracts text items with their positions from a PDF page
 * @param arrayBuffer - PDF file data
 * @param pageNumber - Page number (1-indexed)
 * @returns Object with text items and page dimensions
 */
export async function extractTextWithPositions(
	arrayBuffer: ArrayBuffer,
	pageNumber: number
): Promise<{ items: TextItem[]; pageHeight: number; pageWidth: number }> {
	try {
		const pdfjs = await getPdfJs();
		
		// Clone the ArrayBuffer to avoid "detached" errors
		const clonedBuffer = arrayBuffer.slice(0);

		const loadingTask = pdfjs.getDocument({
			data: clonedBuffer,
			disableAutoFetch: true,
			disableStream: true,
			disableRange: true,
			isEvalSupported: false
		});

		const pdf = await loadingTask.promise;

		if (pageNumber < 1 || pageNumber > pdf.numPages) {
			throw new Error(`Numéro de page invalide: ${pageNumber}`);
		}

		const page = await pdf.getPage(pageNumber);
		const textContent = await page.getTextContent();
		const viewport = page.getViewport({ scale: 1 });

		const items: TextItem[] = [];

		for (const item of textContent.items) {
			if ('str' in item && item.str.trim()) {
				const tx = item.transform;
				const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
				items.push({
					text: item.str,
					x: tx[4],
					y: tx[5], // Keep PDF coordinates (bottom-up)
					width: item.width || 0,
					height: item.height || fontSize,
					fontSize: fontSize,
					fontName: item.fontName || 'unknown',
					transform: tx
				});
			}
		}

		return {
			items,
			pageHeight: viewport.height,
			pageWidth: viewport.width
		};
	} catch (error) {
		throw new Error(
			`Erreur lors de l'extraction du texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}
