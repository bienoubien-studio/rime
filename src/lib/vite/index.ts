import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';
import { RizomError } from '../errors/index.js';
import { hasRunInitCommand } from '../bin/util.server.js';
import { rizomClient } from './browser.js';

dotenv.config({ override: true });
const dev = process.env.NODE_ENV === 'development';

export function rizom(): Plugin[] {

  return [{
    name: 'rizom:base',

    /**
     * 1. Initial check for rizom needed files
     * 2. Watch for change in the config directory and trigger
     * dummy request to reload and rebuild the config on changes 
     */
    configureServer(server) {
      // Add a listener for when the server starts
      server.httpServer?.once('listening', () => {
        if (dev && !hasRunInitCommand()) {
          throw new RizomError(RizomError.INIT, 'Missing required files, run `npx rizom-init`');
        }
      });

      // Add a watcher for config changes
      server.watcher.add('src/config/**/*.ts');
      server.watcher.on('change', async (path) => {

        if (path.includes('src/config/rizom.config')) {
          // Make a dummy request to trigger handler
          try {
            const { host, port, https } = server.config.server;
            const protocol = https ? 'https' : 'http';
            const hostname = host === true ? 'localhost' : host || 'localhost';
            const baseUrl = `${protocol}://${hostname}:${port}`;
            await fetch(`${baseUrl}/api/reload-config`, { method: 'POST' });
          } catch (error) {
            console.error('Failed to trigger config reload:', error);
          }
        }
      });
    },

    config(): UserConfig {
      return {
        optimizeDeps:{
          exclude:[]
        },
        ssr: {
          external: ['sharp']
        },
        build: {
          rollupOptions: {
            external: ['better-sqlite3', 'sharp']
          },
          // target: 'es2022'
        }
      };
    }
  }, rizomClient()]
}
