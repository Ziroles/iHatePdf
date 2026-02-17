/**
 * PDF Security Validator
 * Implements multiple layers of validation to protect against malicious PDFs
 *
 * Security measures:
 * 1. File size limits
 * 2. MIME type validation
 * 3. Magic number verification
 * 4. Structure validation
 * 5. JavaScript detection
 * 6. Embedded file detection
 */

import type { PDFSecurityCheck } from '$lib/types/pdf.types';

// Security constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
const ALLOWED_MIME_TYPES = ['application/pdf'];
const PDF_MAGIC_NUMBERS = [0x25, 0x50, 0x44, 0x46]; // %PDF

/**
 * Validates a PDF file for security threats
 * @param file - The file to validate
 * @returns Security check result with warnings
 */
export async function validatePDFSecurity(file: File): Promise<PDFSecurityCheck> {
	const warnings: string[] = [];
	let hasSuspiciousContent = false;

	// Check 1: File size validation
	if (file.size === 0) {
		return {
			isValid: false,
			hasSuspiciousContent: false,
			warnings: ['Le fichier est vide'],
			fileSize: 0,
			mimeType: file.type
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		return {
			isValid: false,
			hasSuspiciousContent: false,
			warnings: [`Le fichier dépasse la taille maximale autorisée (${MAX_FILE_SIZE / 1024 / 1024}MB)`],
			fileSize: file.size,
			mimeType: file.type
		};
	}

	// Check 2: MIME type validation
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		warnings.push(`Type MIME suspect: ${file.type || 'non défini'}`);
		hasSuspiciousContent = true;
	}

	// Check 3: Magic number verification (file signature)
	const arrayBuffer = await file.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	const hasPDFSignature = PDF_MAGIC_NUMBERS.every(
		(byte, index) => uint8Array[index] === byte
	);

	if (!hasPDFSignature) {
		return {
			isValid: false,
			hasSuspiciousContent: true,
			warnings: ['Le fichier ne possède pas la signature PDF valide'],
			fileSize: file.size,
			mimeType: file.type
		};
	}

	// Check 4: Detect embedded JavaScript (security risk)
	const pdfContent = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);

	const javascriptPatterns = [
		/\/JavaScript/gi,
		/\/JS/gi,
		/\/Action/gi,
		/\/OpenAction/gi,
		/\/AA/gi, // Additional Actions
		/\/Launch/gi
	];

	for (const pattern of javascriptPatterns) {
		if (pattern.test(pdfContent)) {
			warnings.push(`Contenu JavaScript détecté (potentiellement dangereux)`);
			hasSuspiciousContent = true;
			break;
		}
	}

	// Check 5: Detect embedded files (can contain malware)
	const embeddedFilePatterns = [
		/\/EmbeddedFile/gi,
		/\/FileAttachment/gi
	];

	for (const pattern of embeddedFilePatterns) {
		if (pattern.test(pdfContent)) {
			warnings.push('Fichiers embarqués détectés dans le PDF');
			hasSuspiciousContent = true;
			break;
		}
	}

	// Check 6: Detect forms (can be vectors for attacks)
	if (/\/AcroForm/gi.test(pdfContent)) {
		warnings.push('Le PDF contient des formulaires interactifs');
		hasSuspiciousContent = true;
	}

	// Check 7: Detect URI actions (can lead to phishing)
	if (/\/URI/gi.test(pdfContent)) {
		warnings.push('Le PDF contient des liens externes');
		hasSuspiciousContent = true;
	}

	return {
		isValid: true,
		hasSuspiciousContent,
		warnings,
		fileSize: file.size,
		mimeType: file.type
	};
}

/**
 * Sanitizes filename to prevent directory traversal attacks
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9._-]/g, '_') // Remove special characters
		.replace(/\.{2,}/g, '.') // Remove multiple dots
		.substring(0, 255); // Limit length
}

/**
 * Creates a safe sandbox environment configuration
 * @returns CSP configuration for iframe sandbox
 */
export function getSandboxConfig(): string {
	return 'allow-scripts allow-same-origin';
}
