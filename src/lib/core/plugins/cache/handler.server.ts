import type { Handle } from '@sveltejs/kit';

export const handler: Handle = async ({ event, resolve }) => {
	const { rizom } = event.locals;

	// return await resolve(event);
	// Only cache GET requests
	if (event.request.method !== 'GET' || !(process.env.RIZOM_CACHE_ENABLED === 'true')) {
		return await resolve(event);
	}

	// Do not cache panel routes
	if (event.url.pathname.startsWith('/panel')) {
		return await resolve(event);
	}

	// Never cache if there is a user
	if (event.locals.user) {
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
