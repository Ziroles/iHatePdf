/**
 * PDF Renderer Service
 * Uses PDF.js for secure rendering of PDF pages
 * Implements sandboxing and CSP best practices
 */

import { browser } from '$app/environment';

// Lazy load PDF.js only in browser context to avoid SSR issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
	if (!browser) {
		throw new Error('PDF.js can only be used in browser context');
	}

	if (!pdfjsLib) {
		pdfjsLib = await import('pdfjs-dist');
		// Configure PDF.js worker - use local worker file copied by Vite
		pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
	}

	return pdfjsLib;
}

/**
 * Renders a PDF page to a canvas
 * @param arrayBuffer - PDF file data
 * @param pageNumber - Page number to render (1-indexed)
 * @param canvas - Canvas element to render to
 * @param scale - Rendering scale (default: 1.5)
 */
export async function renderPDFPage(
	arrayBuffer: ArrayBuffer,
	pageNumber: number,
	canvas: HTMLCanvasElement,
	scale: number = 1.5
): Promise<void> {
	try {
		const pdfjs = await getPdfJs();

		// Clone the ArrayBuffer to avoid "detached" errors
		const clonedBuffer = arrayBuffer.slice(0);

		// Load PDF document
		const loadingTask = pdfjs.getDocument({
			data: clonedBuffer,
			// Security: disable all potentially dangerous features
			disableAutoFetch: true,
			disableStream: true,
			disableRange: true,
			// Don't allow JavaScript execution in PDFs
			isEvalSupported: false
		});

		const pdf = await loadingTask.promise;

		// Validate page number
		if (pageNumber < 1 || pageNumber > pdf.numPages) {
			throw new Error(`Numéro de page invalide: ${pageNumber} (Total: ${pdf.numPages})`);
		}

		// Get page
		const page = await pdf.getPage(pageNumber);

		// Set up canvas
		const viewport = page.getViewport({ scale });
		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Impossible d\'obtenir le contexte 2D du canvas');
		}

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		// Render page
		const renderContext: any = {
			canvasContext: context,
			viewport: viewport
		};

		await page.render(renderContext).promise;
	} catch (error) {
		throw new Error(
			`Erreur lors du rendu de la page: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}

/**
 * Gets the number of pages in a PDF
 * @param arrayBuffer - PDF file data
 * @returns Number of pages
 */
export async function getPDFPageCount(arrayBuffer: ArrayBuffer): Promise<number> {
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
		return pdf.numPages;
	} catch (error) {
		throw new Error(
			`Erreur lors de la lecture du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}

/**
 * Extracts text content from a PDF page
 * @param arrayBuffer - PDF file data
 * @param pageNumber - Page number (1-indexed)
 * @returns Text content
 */
export async function extractPageText(
	arrayBuffer: ArrayBuffer,
	pageNumber: number
): Promise<string> {
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

		// Combine all text items
		return textContent.items
			.map((item: any) => item.str)
			.join(' ');
	} catch (error) {
		throw new Error(
			`Erreur lors de l'extraction du texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
		);
	}
}
