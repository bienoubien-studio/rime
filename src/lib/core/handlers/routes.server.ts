import { json, type Handle } from '@sveltejs/kit';
import buildNavigation from '$lib/panel/navigation.js';
import { dev } from '$app/environment';

export const handleRoutes: Handle = async ({ event, resolve }) => {
	const { rizom, user } = event.locals;

	// handle dummy request from vite to reload config
	if (dev && event.url.pathname === '/api/reload-config') {
		return json({ success: true });
	}
	
	// build panel navigation
	if (event.url.pathname?.startsWith('/panel') && event.request.method === 'GET') {
		event.locals.routes = buildNavigation(rizom.config.raw, user);
	}
	
	// Handle custom routes from config and plugins
	const routes = rizom.config.get('routes') || {};
	if (event.url.pathname in routes) {
		const route = routes[event.url.pathname];
		if (event.request.method in route) {
			return route[event.request.method](event);
		}
	}

	return resolve(event);
};
