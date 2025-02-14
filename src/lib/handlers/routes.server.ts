import { json, type Handle } from '@sveltejs/kit';
import apiInit from '../api/init.js';
import { logout } from 'rizom/panel/pages/logout/actions.server.js';
import buildNavigation from '$lib/panel/navigation.js';
import { PACKAGE_NAME } from 'rizom/constant.js';

export const handleRoutes: Handle = async ({ event, resolve }) => {
	const { rizom, user } = event.locals;

	if (event.url.pathname === '/api/reload-config') {
		return json({ success: true });
	}

	if (event.url.pathname?.startsWith('/i18n')) {
		return await handleTranslations(event.url.pathname);
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

const handleTranslations = async (pathname: string) => {
	// Extract locale and namespace from path
	const [_, _i18n, locale, namespace] = pathname.split('/');

	try {
		// Import the translations
		const translations = await import(`${PACKAGE_NAME}/panel/i18n/${locale}/${namespace}.js`);
		return new Response(JSON.stringify(translations.default), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Failed to load translations:', error);
		return new Response('Translation not found', { status: 404 });
	}
};
