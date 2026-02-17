/**
 * Type definitions for PDF operations
 * Ensures type safety across the application
 */

export interface PDFFile {
	name: string;
	size: number;
	type: string;
	lastModified: number;
	arrayBuffer: ArrayBuffer;
}

export interface PDFMetadata {
	pageCount: number;
	title?: string;
	author?: string;
	subject?: string;
	creator?: string;
	producer?: string;
	creationDate?: Date;
	modificationDate?: Date;
}

export interface PDFTextContent {
	pageNumber: number;
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	fontSize: number;
	fontName: string;
}

export interface PDFEditOperation {
	type: 'text-edit' | 'text-add' | 'text-delete';
	pageNumber: number;
	originalText?: string;
	newText: string;
	position?: { x: number; y: number };
	fontSize?: number;
	fontName?: string;
}

export interface PDFProcessingResult {
	success: boolean;
	data?: Uint8Array;
	error?: string;
	metadata?: PDFMetadata;
}

export interface PDFSecurityCheck {
	isValid: boolean;
	hasSuspiciousContent: boolean;
	warnings: string[];
	fileSize: number;
	mimeType: string;
}
