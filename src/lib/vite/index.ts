import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';
import { RizomError } from '../errors';
import { hasRunInitCommand } from '../bin/util.server.js';

dotenv.config({ override: true });
const dev = process.env.NODE_ENV === 'development';

export function rizom(): Plugin {
	return {
		name: 'rizom',
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
				ssr: {
					external: ['sharp']
				},
				build: {
					rollupOptions: {
						external: ['better-sqlite3', 'sharp']
					},
					target: 'es2022'
				}
			};
		}
	};
}
