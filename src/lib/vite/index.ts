import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export function rizom(): Plugin {
	return {
		name: 'rizom',
		configureServer(server) {
			server.watcher.add('src/config/**/*.ts');
			server.watcher.on('change', async (path) => {
				if (path.includes('config')) {
					// Make a dummy request to trigger handler
					try {
						const { host, port, https } = server.config.server;
						const protocol = https ? 'https' : 'http';
						const hostname = host === true ? 'localhost' : host || 'localhost';
						const baseUrl = `${protocol}://${hostname}:${port}`;
						await fetch(`${baseUrl}/api/reload-config`);
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
