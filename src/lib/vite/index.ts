import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export function rizom(): Plugin {
	return {
		name: 'rizom',

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
