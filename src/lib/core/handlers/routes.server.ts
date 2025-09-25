import buildNavigation from '$lib/panel/navigation.js';
import { type Handle } from '@sveltejs/kit';

export const handleRoutes: Handle = async ({ event, resolve }) => {
	const { rizom, user } = event.locals;

	const isSignInRoute = event.url.pathname === '/panel/sign-in';
	const isPanelRoute = event.url.pathname.startsWith('/panel') && !isSignInRoute;

	// build panel navigation
	if (isPanelRoute && event.request.method === 'GET') {
		event.locals.routes = buildNavigation(rizom.config.raw, user);
	}

	// Handle custom routes from config and plugins
	const routes = rizom.config.raw.$routes || {};
	if (event.url.pathname in routes) {
		const route = routes[event.url.pathname];
		type RequestMethod = 'POST' | 'GET' | 'PATCH' | 'DELETE';
		const method: RequestMethod = event.request.method as RequestMethod;
		if (method in route && !!route[method]) {
			return route[method](event);
		}
	}

	return resolve(event);
};
