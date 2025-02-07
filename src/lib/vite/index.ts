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
						await fetch('http://rizom.test:5173/api/reload-config');
					} catch (error) {
						console.error('Failed to trigger config reload:', error);
					}
				}
			});
		},
		config(): UserConfig {
			return {
				build: {
					rollupOptions: {
						external: ['better-sqlite3']
					},
					target: 'es2022'
				}
			};
		}
	};
}
