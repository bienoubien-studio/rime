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
import { logger, taskLogger } from '$lib/util/logger/index.server.js';
import { slugify } from '$lib/util/string.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { BuiltConfig } from '$lib/types/config.js';
import type { Dic } from '$lib/types/util.js';
import { makeVersionsTableName } from 'rizom/util/schema.js';

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
		css:${config.panel.css ? config.panel.css : 'none'}
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

	// Handle custom CSS in layout file
	if (fs.existsSync(path.join(rizomRoutes, '+layout.svelte'))) {
		if (config.panel?.css) {
			injectCustomCSS(path.join(rizomRoutes, '+layout.svelte'), config.panel.css);
		} else {
			removeCustomCSS(path.join(rizomRoutes, '+layout.svelte'));
		}
	}

	// root layout
	fs.writeFileSync(path.join(rootRoutes, '+layout.server.ts'), rootLayoutServer);

	function generateCollectionAPIRoutes (slug:string, isAuth:boolean) {
		const collectionAPIRoute = path.join(apiRoute, slug);

		//////////////////////////////////////////////
		// API routes
		//////////////////////////////////////////////

		if (!fs.existsSync(collectionAPIRoute)) {
			fs.mkdirSync(collectionAPIRoute);
			fs.writeFileSync(
				path.join(collectionAPIRoute, '+server.ts'),
				collectionAPIServer(slug)
			);

			const collectionIdAPIRoute = path.join(collectionAPIRoute, '[id]');
			fs.mkdirSync(collectionIdAPIRoute);

			fs.writeFileSync(
				path.join(collectionIdAPIRoute, '+server.ts'),
				collectionIdAPIServer(slug)
			);

			/** Auth specific routes */
			if (isAuth) {
				/** Login */
				const collectionAPIAuthLogin = path.join(collectionAPIRoute, 'login');
				fs.mkdirSync(collectionAPIAuthLogin);
				fs.writeFileSync(
					path.join(collectionAPIAuthLogin, '+server.ts'),
					collectionAPIAuthLoginServer(slug)
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
	} 

	for (const collection of config.collections) {
		const collectionRoute = path.join(panelRoute, collection.slug);
		
		generateCollectionAPIRoutes(collection.slug, !!collection.auth)
		if( collection.versions ){
			generateCollectionAPIRoutes(makeVersionsTableName(collection.slug), !!collection.auth)
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

	function generateAreaAPIRoutes (slug:string) {
		const areaAPIRoute = path.join(apiRoute, slug);
		if (!fs.existsSync(areaAPIRoute)) {
			fs.mkdirSync(areaAPIRoute);
			fs.writeFileSync(path.join(areaAPIRoute, '+server.ts'), areaAPIServer(slug));
		}
	}

	for (const area of config.areas) {
		const areaRoute = path.join(panelRoute, area.slug);
		
		generateAreaAPIRoutes(area.slug)
		if( area.versions ){
			generateAreaAPIRoutes(makeVersionsTableName(area.slug))
		}
		
		if (!fs.existsSync(areaRoute)) {
			fs.mkdirSync(areaRoute);
			fs.writeFileSync(path.join(areaRoute, '+page.server.ts'), areaPageServer(area.slug));
			fs.writeFileSync(path.join(areaRoute, '+page.svelte'), areaPageSvelte(area.slug));
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
					logger.error(`Error renaming ${fullPath}:`, renameErr);
				}
			}
		});
	} catch (err) {
		logger.error('Error reading directory:', err);
	}
}

/**
 * Injects a custom CSS link into the layout file
 * @param layoutFilePath Path to the layout file
 * @param cssPath Custom CSS path from config
 */
function injectCustomCSS(layoutFilePath: string, cssPath: string) {
	try {
		if (fs.existsSync(layoutFilePath)) {
			let content = fs.readFileSync(layoutFilePath, 'utf8');
			const cssLinkTag = `<svelte:head><link rel="stylesheet" href="${cssPath}" /></svelte:head>`;
			
			if (content.includes('<svelte:head>')) {
				// Replace existing svelte:head tag with our custom CSS
				const headRegex = /<svelte:head>.*?<\/svelte:head>/s;
				content = content.replace(headRegex, cssLinkTag);
				fs.writeFileSync(layoutFilePath, content, 'utf8');
				taskLogger.done(`Custom CSS link updated in ${layoutFilePath}`);
			} else {
				// Find the position to insert the custom CSS link
				const insertPosition = content.indexOf('<div class="rz-root">');
				
				if (insertPosition !== -1) {
					// Insert the CSS link tag before the div
					const newContent = content.slice(0, insertPosition) + cssLinkTag + content.slice(insertPosition);
					
					// Write the updated content back to the file
					fs.writeFileSync(layoutFilePath, newContent, 'utf8');
					taskLogger.done(`Custom CSS link added in ${layoutFilePath}`);
				} else {
					logger.error(`Could not find insertion point in ${layoutFilePath}`);
				}
			}
		} else {
			logger.error(`Layout file not found: ${layoutFilePath}`);
		}
	} catch (err) {
		logger.error(`Error injecting custom CSS into layout file: ${err}`);
	}
}

/**
 * Removes any custom CSS link from the layout file
 * @param layoutFilePath Path to the layout file
 */
function removeCustomCSS(layoutFilePath: string) {
	try {
		if (fs.existsSync(layoutFilePath)) {
			let content = fs.readFileSync(layoutFilePath, 'utf8');
			
			if (content.includes('<svelte:head>')) {
				// Remove the svelte:head tag and its contents
				const headRegex = /<svelte:head>.*?<\/svelte:head>/s;
				content = content.replace(headRegex, '');
				
				// Write the updated content back to the file
				fs.writeFileSync(layoutFilePath, content, 'utf8');
				taskLogger.done(`Custom CSS link removed from ${layoutFilePath}`);
			}
		} else {
			logger.error(`Layout file not found: ${layoutFilePath}`);
		}
	} catch (err) {
		logger.error(`Error removing custom CSS from layout file: ${err}`);
	}
}

export default generateRoutes;
