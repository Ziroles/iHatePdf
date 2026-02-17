/**
 * Svelte Store for PDF State Management
 * Centralized state management for PDF operations
 */

import { writable, derived } from 'svelte/store';
import type { PDFDocument } from 'pdf-lib';
import type { PDFMetadata, PDFSecurityCheck, PDFEditOperation } from '$lib/types/pdf.types';

interface PDFState {
	file: File | null;
	arrayBuffer: ArrayBuffer | null;
	pdfDocument: PDFDocument | null;
	metadata: PDFMetadata | null;
	securityCheck: PDFSecurityCheck | null;
	currentPage: number;
	isLoading: boolean;
	error: string | null;
	editOperations: PDFEditOperation[];
}

const initialState: PDFState = {
	file: null,
	arrayBuffer: null,
	pdfDocument: null,
	metadata: null,
	securityCheck: null,
	currentPage: 1,
	isLoading: false,
	error: null,
	editOperations: []
};

function createPDFStore() {
	const { subscribe, set, update } = writable<PDFState>(initialState);

	return {
		subscribe,
		
		// Set the current PDF file
		setFile: (file: File | null) => update(state => ({ ...state, file })),
		
		// Set the array buffer
		setArrayBuffer: (arrayBuffer: ArrayBuffer | null) => 
			update(state => ({ ...state, arrayBuffer })),
		
		// Set the PDF document
		setPDFDocument: (pdfDocument: PDFDocument | null) => 
			update(state => ({ ...state, pdfDocument })),
		
		// Set metadata
		setMetadata: (metadata: PDFMetadata | null) => 
			update(state => ({ ...state, metadata })),
		
		// Set security check results
		setSecurityCheck: (securityCheck: PDFSecurityCheck | null) => 
			update(state => ({ ...state, securityCheck })),
		
		// Set current page
		setCurrentPage: (page: number) => 
			update(state => ({ ...state, currentPage: page })),
		
		// Set loading state
		setLoading: (isLoading: boolean) => 
			update(state => ({ ...state, isLoading })),
		
		// Set error
		setError: (error: string | null) => 
			update(state => ({ ...state, error })),
		
		// Add edit operation
		addEditOperation: (operation: PDFEditOperation) => 
			update(state => ({ 
				...state, 
				editOperations: [...state.editOperations, operation] 
			})),
		
		// Clear edit operations
		clearEditOperations: () => 
			update(state => ({ ...state, editOperations: [] })),
		
		// Reset store
		reset: () => set(initialState)
	};
}

export const pdfStore = createPDFStore();

// Derived stores for convenience
export const hasFile = derived(pdfStore, $pdfStore => $pdfStore.file !== null);
export const hasSuspiciousContent = derived(
	pdfStore, 
	$pdfStore => $pdfStore.securityCheck?.hasSuspiciousContent ?? false
);
export const pageCount = derived(
	pdfStore, 
	$pdfStore => $pdfStore.metadata?.pageCount ?? 0
);
