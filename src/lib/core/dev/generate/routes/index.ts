import type { BuiltConfig } from '$lib/core/config/types.js';
import { logger } from '$lib/core/logger/index.server.js';
import { makeUploadDirectoriesSlug, makeVersionsSlug } from '$lib/util/schema.js';
import type { Dic } from '$lib/util/types.js';
import fs from 'fs';
import path from 'path';
import { areaAPIRoutes, areaRoutes, areaVersionsPanelRoutes } from './area.js';
import { collectionAPIRoutes, collectionPanelRoutes, collectionVersionsPanelRoutes } from './collection.js';
import { commonRoutes, customRoute } from './common.js';
import { injectCustomCSS, removeCustomCSS } from './custom-css.js';
import { ensureDir, shouldRegenerateRoutes, writeRouteFile, type Routes } from './util.js';

const projectRoot = process.cwd();

/**
 * Main function to generate browser routes based on configuration
 */
function generateRoutes(config: BuiltConfig): void {
	// 1. Check if routes need to be regenerated
	if (!shouldRegenerateRoutes(config)) {
		return;
	}

	// 2. Ensure base directories exist
	const rootRoutes = path.resolve(projectRoot, 'src', 'routes');
	const rizomRoutes = path.join(rootRoutes, '(rizom)');
	const panelRoute = path.join(rizomRoutes, 'panel');

	fs.rmSync(rizomRoutes, { recursive: true, force: true });

	ensureDir(rootRoutes);
	ensureDir(rizomRoutes);
	ensureDir(panelRoute);

	// Function that generate area/collection routes files from a Routes object
	const processRoutes = (slug: string, routes: Routes) => {
		for (const [pattern, files] of Object.entries(routes)) {
			const routePath = pattern.replace('{area.slug}', slug).replace('{collection.slug}', slug);
			// Generate each file type (page, layout, etc.)
			for (const [fileType, templateFn] of Object.entries(files)) {
				writeRouteFile(rootRoutes, routePath, fileType, templateFn(slug));
			}
		}
	};

	// 3. Process common routes
	for (const [pattern, files] of Object.entries(commonRoutes)) {
		for (const [fileType, templateFn] of Object.entries(files)) {
			writeRouteFile(rootRoutes, pattern, fileType, templateFn());
		}
	}

	// 4. Process area routes
	for (const area of config.areas) {
		processRoutes(area.slug, areaRoutes);
		processRoutes(area.slug, areaAPIRoutes);

		if (area.versions) {
			processRoutes(area.slug, areaVersionsPanelRoutes);
			// Use collections API route as area_versions is a collection
			processRoutes(makeVersionsSlug(area.slug), collectionAPIRoutes);
		}
	}

	// 5. Process collection routes
	for (const collection of config.collections) {
		// Function that generate routes files
		const processRoutes = (slug: string, routes: Routes) => {
			for (const [pattern, files] of Object.entries(routes)) {
				const routePath = pattern.replace('{collection.slug}', slug);
				// Generate each file type (page, layout, etc.)
				for (const [fileType, templateFn] of Object.entries(files)) {
					// Check if function takes parameters before calling it
					const content = templateFn.length > 0 ? templateFn(slug) : templateFn();
					writeRouteFile(rootRoutes, routePath, fileType, content);
				}
			}
		};

		// Panel routes
		processRoutes(collection.slug, collectionPanelRoutes);
		processRoutes(collection.slug, collectionAPIRoutes);

		if (collection.versions) {
			processRoutes(collection.slug, collectionVersionsPanelRoutes);
			processRoutes(makeVersionsSlug(collection.slug), collectionAPIRoutes);
		}
		if (collection.upload) {
			processRoutes(makeUploadDirectoriesSlug(collection.slug), collectionAPIRoutes);
		}
	}

	// 6. Handle custom routes from config
	const customRoutes: Dic = config.panel?.routes;
	if (customRoutes) {
		for (const [route, routeConfig] of Object.entries(customRoutes)) {
			const routePath = path.join('(rizom)', 'panel', route);
			writeRouteFile(rootRoutes, routePath, 'page', customRoute(routeConfig));
		}
	}

	// 7. Handle custom CSS in layout file
	const layoutPath = path.join(rizomRoutes, '+layout.svelte');
	if (fs.existsSync(layoutPath)) {
		if (config.panel?.css) {
			injectCustomCSS(layoutPath, config.panel.css);
		} else {
			removeCustomCSS(layoutPath);
		}
	}

	logger.info('[✓] Routes generated');
}

export default generateRoutes;
