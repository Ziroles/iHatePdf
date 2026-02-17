/**
 * SvelteKit Hooks - Server-side security
 * Implements security headers for all responses
 */

import type { Handle } from '@sveltejs/kit';
import { securityHeaders } from '$lib/config/security.config';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Apply security headers to all responses
	Object.entries(securityHeaders).forEach(([header, value]) => {
		response.headers.set(header, value);
	});

	return response;
};
