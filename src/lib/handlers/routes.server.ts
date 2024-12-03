import { type Handle } from '@sveltejs/kit';
import apiInit from '../api/init.js';
import { logout } from 'rizom/panel/pages/logout/actions.server.js';
import buildNavigation from '$lib/panel/navigation.js';
import path from 'path';
import fs from 'fs';
import { error } from '@sveltejs/kit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handleRoutes: Handle = async ({ event, resolve }) => {
	const { rizom, user } = event.locals;

	if (event.url.pathname.startsWith('/panel/fonts')) {
		return await handleFont(event.url.pathname);
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

const handleFont = async (pathname: string) => {
	const fontFile = pathname.split('panel/fonts/').at(-1) as string;
	const fontPath = path.resolve(__dirname, '..', 'panel', 'fonts', fontFile);

	try {
		const font = await fs.promises.readFile(fontPath);

		return new Response(font, {
			headers: {
				'Content-Type': getMimeType(path.extname(fontPath)),
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (err: any) {
		console.log(err);
		throw error(404, 'Font not found');
	}
};

function getMimeType(extension: string) {
	switch (extension) {
		case '.woff':
			return 'font/woff';
		case '.woff2':
			return 'font/woff2';
		case '.ttf':
			return 'font/ttf';
		case '.otf':
			return 'font/otf';
		default:
			return 'application/octet-stream';
	}
}
