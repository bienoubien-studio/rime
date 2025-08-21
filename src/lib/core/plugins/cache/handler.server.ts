import type { Handle } from '@sveltejs/kit';

export const handler: Handle = async ({ event, resolve }) => {
	const { rizom } = event.locals;

	event.locals.cacheEnabled = false;

	// Only cache GET requests
	if (event.request.method !== 'GET') {
		return await resolve(event);
	}

	// Do not cache if env var is not 'true'
	if (!(process.env.RIZOM_CACHE_ENABLED === 'true')) {
		return await resolve(event);
	}

	// Do not cache panel routes
	if (event.url.pathname.startsWith('/panel')) {
		return await resolve(event);
	}

	if (!rizom.cache.isEnabled(event)) {
		return await resolve(event);
	}

	event.locals.cacheEnabled = true;
	event.setHeaders({ 'cache-control': 'max-age=3600' });

	return await resolve(event);
};

declare global {
	namespace App {
		interface Locals {
			cacheEnabled: boolean;
		}
	}
}
