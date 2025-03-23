import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import { logger } from '../util/logger/index.js';

// Virtual module ID that will be used in imports
const VIRTUAL_MODULE_ID = 'virtual:rizom-config';
// The resolved virtual module ID (what Vite uses internally)
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export function rizomConfigVirtualModule(): Plugin {
  return {
    name: 'rizom:config-virtual-module',
    
    // This tells Vite how to resolve our virtual module
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return null;
    },
    
    // This provides the content for our virtual module
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // Generate a simple browser-safe config
        return generateSimpleBrowserConfig();
      }
      return null;
    },
    
    // Watch for changes to the config file
    configureServer(server) {
      server.watcher.add('src/config/rizom.config.ts');
      server.watcher.on('change', (path) => {
        if (path.includes('src/config/rizom.config.ts')) {
          // Invalidate the module to trigger a reload
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            // Notify client to reload
            server.ws.send({ type: 'full-reload' });
          }
        }
      });
    },
    
    // This hook runs at the beginning of the build process
    buildStart() {
      logger.info('Preparing rizom config for build...');
    },
    
    // This hook runs at the end of the build process
    closeBundle() {
      logger.info('Rizom config build complete');
    }
  };
}

// Generate a simple browser-safe config without importing server-side code
function generateSimpleBrowserConfig() {
  return `
    // This is a simple browser-safe config
    // It's generated at build/dev time and doesn't import server-side code
    
    // Don't add imports from tiptap !!!

    // Create a minimal browser-safe config
    const browserConfig = {
      // Add minimal properties needed for client-side rendering
      collections: [],
      panel: {
        language: 'en',
        navigation: {
          collections: [],
          areas: []
        },
        components: {
          header: [],
          collectionHeader: []
        }
      }
    };
    
    export default browserConfig;
  `;
}
