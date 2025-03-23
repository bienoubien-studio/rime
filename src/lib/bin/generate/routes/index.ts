import fs from 'fs';
import path from 'path';
import {
	collectionAPIAuthLoginServer,
	collectionAPIAuthLogoutServer,
	collectionAPIServer,
	collectionDocServer,
	collectionDocSvelte,
	collectionIdAPIServer,
	collectionLayoutServer,
	collectionLayoutSvelte,
	collectionPageSvelte,
	customRouteSvelte,
	areaAPIServer,
	areaPageServer,
	areaPageSvelte,
	rootLayoutServer
} from './templates.js';
import cache from '../cache/index.js';
import { taskLogger } from 'rizom/util/logger/index.js';
import { slugify } from '$lib/util/string.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = process.cwd();

function generateRoutes(config: BuiltConfig) {
	const memo = `
    areas:${config.areas.map((g) => `${g.slug}`).join(',')}
    collections:${config.collections.map((c) => `${c.slug}${c.auth ? '.auth' : ''}`).join(',')}
    custom:${
			config.panel?.routes
				? Object.entries(config.panel.routes)
						.map(([k, v]) => `${k}-${slugify(v.component.toString())}`)
						.join(',')
				: ''
		}
  `;
	const cachedMemo = cache.get('routes');

	if (cachedMemo && cachedMemo === memo) {
		// taskLogger.info('-  routes   :: No change detected');
		return;
	} else {
		cache.set('routes', memo);
	}

	const rootRoutes = path.resolve(projectRoot, 'src', 'routes');
	const rizomRoutes = path.join(rootRoutes, '(rizom)');
	const panelRoute = path.join(rizomRoutes, 'panel');
	const apiRoute = path.join(rizomRoutes, 'api');

	if (!fs.existsSync(rootRoutes)) {
		fs.mkdirSync(rootRoutes);
	}

	if (!fs.existsSync(rizomRoutes)) {
		fs.cpSync(path.resolve(__dirname, 'tree', '(rizom)'), rizomRoutes, {
			recursive: true
		});
		removeTxtSuffix(rizomRoutes);
	}

	if (!fs.existsSync(apiRoute)) {
		fs.mkdirSync(apiRoute);
	}

	// root layout
	fs.writeFileSync(path.join(rootRoutes, '+layout.server.ts'), rootLayoutServer);

	for (const collection of config.collections) {
		const collectionRoute = path.join(panelRoute, collection.slug);
		const collectionAPIRoute = path.join(apiRoute, collection.slug);

		//////////////////////////////////////////////
		// API routes
		//////////////////////////////////////////////

		if (!fs.existsSync(collectionAPIRoute)) {
			fs.mkdirSync(collectionAPIRoute);
			fs.writeFileSync(
				path.join(collectionAPIRoute, '+server.ts'),
				collectionAPIServer(collection.slug)
			);

			const collectionIdAPIRoute = path.join(collectionAPIRoute, '[id]');
			fs.mkdirSync(collectionIdAPIRoute);

			fs.writeFileSync(
				path.join(collectionIdAPIRoute, '+server.ts'),
				collectionIdAPIServer(collection.slug)
			);

			/** Auth specific routes */
			if (collection.auth) {
				/** Login */
				const collectionAPIAuthLogin = path.join(collectionAPIRoute, 'login');
				fs.mkdirSync(collectionAPIAuthLogin);
				fs.writeFileSync(
					path.join(collectionAPIAuthLogin, '+server.ts'),
					collectionAPIAuthLoginServer(collection.slug)
				);

				/** Logout */
				const collectionAPIAuthLogout = path.join(collectionAPIRoute, 'logout');
				fs.mkdirSync(collectionAPIAuthLogout);
				fs.writeFileSync(
					path.join(collectionAPIAuthLogout, '+server.ts'),
					collectionAPIAuthLogoutServer()
				);
			}
		}

		//////////////////////////////////////////////
		// Panel routes
		//////////////////////////////////////////////

		if (!fs.existsSync(collectionRoute)) {
			fs.mkdirSync(collectionRoute);
			fs.mkdirSync(path.join(collectionRoute, '[id]'));

			/** Layout & Root Pages */
			fs.writeFileSync(
				path.join(collectionRoute, '+layout.server.ts'),
				collectionLayoutServer(collection.slug)
			);
			fs.writeFileSync(
				path.join(collectionRoute, '+layout.svelte'),
				collectionLayoutSvelte(collection.slug)
			);
			fs.writeFileSync(path.join(collectionRoute, '+page.svelte'), collectionPageSvelte());

			/** Id Page */
			fs.writeFileSync(
				path.join(collectionRoute, '[id]', '+page.svelte'),
				collectionDocSvelte(collection.slug)
			);
			fs.writeFileSync(
				path.join(collectionRoute, '[id]', '+page.server.ts'),
				collectionDocServer(collection.slug)
			);
		}
	}

	for (const area of config.areas) {
		const areaRoute = path.join(panelRoute, area.slug);
		const areaAPIRoute = path.join(apiRoute, area.slug);

		if (!fs.existsSync(areaRoute)) {
			fs.mkdirSync(areaRoute);
			fs.writeFileSync(path.join(areaRoute, '+page.server.ts'), areaPageServer(area.slug));
			fs.writeFileSync(path.join(areaRoute, '+page.svelte'), areaPageSvelte(area.slug));
		}

		//////////////////////////////////////////////
		// API routes
		//////////////////////////////////////////////

		if (!fs.existsSync(areaAPIRoute)) {
			fs.mkdirSync(areaAPIRoute);
			fs.writeFileSync(path.join(areaAPIRoute, '+server.ts'), areaAPIServer(area.slug));
		}
	}

	const customRoutes: Dic = config.panel?.routes;
	if (customRoutes) {
		for (const [route, routeConfig] of Object.entries(customRoutes)) {
			const routePath = path.join(panelRoute, route);

			if (!fs.existsSync(routePath)) {
				fs.mkdirSync(routePath);
				fs.writeFileSync(path.join(routePath, '+page.svelte'), customRouteSvelte(routeConfig));
			}
		}
	}

	taskLogger.done('Routes generated');
}

async function removeTxtSuffix(directory: string) {
	try {
		// Read the contents of the directory synchronously
		const entries = fs.readdirSync(directory, { withFileTypes: true });

		entries.forEach((entry) => {
			const fullPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				// If it's a directory, recurse into it
				removeTxtSuffix(fullPath);
			} else if (entry.isFile() && entry.name.endsWith('.txt')) {
				// If it's a file ending with '.js.txt', rename it
				const newName = entry.name.slice(0, -4); // Remove the '.txt' extension
				const newPath = path.join(directory, newName);

				try {
					fs.renameSync(fullPath, newPath);
				} catch (renameErr) {
					console.error(`Error renaming ${fullPath}:`, renameErr);
				}
			}
		});
	} catch (err) {
		console.error('Error reading directory:', err);
	}
}

export default generateRoutes;
