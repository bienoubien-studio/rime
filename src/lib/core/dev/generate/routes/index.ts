import fs from 'fs';
import path from 'path';
import { writeRouteFile, ensureDir, shouldRegenerateRoutes, type RouteDefinition, type Routes } from './util.js';
import { collectionAPIAuthRoutes, collectionAPIRoutes, collectionPanelRoutes, collectionVersionsPanelRoutes } from './collection.js';
import { areaAPIRoutes, areaRoutes, areaVersionsPanelRoutes } from './area.js';
import { commonRoutes, customRoute } from './common.js';
import { injectCustomCSS, removeCustomCSS } from './custom-css.js';
import { taskLogger } from '$lib/core/logger/index.server.js';
import type { BuiltConfig } from '$lib/core/config/types/index.js';
import type { Dic } from '$lib/util/types.js';

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

  ensureDir(rootRoutes);
  ensureDir(rizomRoutes);
  ensureDir(panelRoute);


  // Function that generate area routes files from a Routes object
  const processRoutes = (slug: string, routes: Routes) => {
    for (const [pattern, files] of Object.entries(routes)) {
      const routePath = pattern.replace('{area.slug}', slug).replace('{collection.slug}', slug);
      // Generate each file type (page, layout, etc.)
      for (const [fileType, templateFn] of Object.entries(files)) {
        writeRouteFile(rootRoutes, routePath, fileType, templateFn(slug));
      }
    }
  }
  
  // 3. Process common routes
  for (const [pattern, files] of Object.entries(commonRoutes)) {
    for (const [fileType, templateFn] of Object.entries(files)) {
      writeRouteFile(rootRoutes, pattern, fileType, templateFn());
    }
  }

  // 4. Process area routes
  for (const area of config.areas) {
    const slug = area.slug;



    processRoutes(area.slug, areaRoutes)
    processRoutes(area.slug, areaAPIRoutes)

    if (area.versions) {
      processRoutes(area.slug, areaVersionsPanelRoutes)
      // Use collections API route as area_versions is a collection
      processRoutes(area.slug + '_versions', collectionAPIRoutes)
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
          writeRouteFile(rootRoutes, routePath, fileType, templateFn(slug));
        }
      }
    }

    // Panel routes
    processRoutes(collection.slug, collectionPanelRoutes)
    processRoutes(collection.slug, collectionAPIRoutes)
    processRoutes(collection.slug, collectionAPIAuthRoutes)

    if (collection.versions) {
      processRoutes(collection.slug, collectionVersionsPanelRoutes)
      processRoutes(collection.slug + '_versions', collectionAPIRoutes)
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

  taskLogger.done('Routes generated');
}

export default generateRoutes;
