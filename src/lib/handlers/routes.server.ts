import { json, type Handle } from '@sveltejs/kit';
import apiInit from '../api/init.js';
import { logout } from 'rizom/panel/pages/logout/actions.server.js';
import buildNavigation from '$lib/panel/navigation.js';

export const handleRoutes: Handle = async ({ event, resolve }) => {
	const { rizom, user } = event.locals;

	if (event.url.pathname === '/api/reload-config') {
		return json({ success: true });
	}

	if (event.url.pathname?.startsWith('/panel') && event.request.method === 'GET') {
		event.locals.routes = buildNavigation(rizom.config.raw, user);
	}

	if (event.url.pathname === '/api/init' && event.request.method === 'POST') {
		return apiInit(event);
	}

	if (event.url.pathname === '/logout' && event.request.method === 'POST') {
		return logout(event);
	}

	const routes = rizom.config.get('routes') || {};
	if (event.url.pathname in routes) {
		const route = routes[event.url.pathname];
		if (event.request.method in route) {
			return route[event.request.method](event);
		}
	}

	return resolve(event);
};
