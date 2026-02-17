/**
 * Security Configuration
 * Content Security Policy and other security headers
 */

export const securityHeaders = {
	// Content Security Policy - Restrict what can be loaded/executed
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for PDF.js worker
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		"connect-src 'self' blob:",
		"worker-src 'self' blob:",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	].join('; '),

	// Prevent MIME type sniffing
	'X-Content-Type-Options': 'nosniff',

	// Enable XSS protection
	'X-XSS-Protection': '1; mode=block',

	// Prevent clickjacking
	'X-Frame-Options': 'DENY',

	// Referrer policy
	'Referrer-Policy': 'strict-origin-when-cross-origin',

	// Permissions policy (restrict dangerous features)
	'Permissions-Policy': [
		'camera=()',
		'microphone=()',
		'geolocation=()',
		'payment=()',
		'usb=()'
	].join(', ')
};

/**
 * CORS configuration for local development
 */
export const corsConfig = {
	origin: false, // No external origins allowed
	credentials: false
};
