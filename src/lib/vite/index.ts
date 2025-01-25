import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export function rizom(): Plugin {
	return {
		name: 'rizom',
		async handleHotUpdate({ file, server }) {
			if (file.includes('src/config')) {
				server.ws.send({
					type: 'custom',
					event: 'special-update',
					data: {}
				});
			}
			server.ws.send({ type: 'full-reload' });
			return [];
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
