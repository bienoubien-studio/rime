import { json, type Handle } from '@sveltejs/kit';
import apiInit from '../api/init.js';
import { logout } from 'rizom/panel/pages/logout/actions.server.js';
import buildNavigation from '$lib/panel/navigation.js';
import { PACKAGE_NAME } from 'rizom/constant.js';
import { dev } from '$app/environment';
import { existsSync } from 'fs';
import path from 'path';
import cache from 'rizom/bin/generate/cache/index.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
		const isPackageDev = process.env.RIZOM_ENV === 'package';
		const pathToTranslation = isPackageDev
			? `../panel/i18n/${locale}/${namespace}.js`
			: `${PACKAGE_NAME}/panel/i18n/${locale}/${namespace}.js`;
		const translations = await import(/* @vite-ignore */ pathToTranslation);

		return new Response(JSON.stringify(translations.default), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error: any) {
		console.error('Failed to load translations:', error.message);
		return new Response('Translation not found', { status: 404 });
	}
};
