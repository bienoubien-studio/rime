import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export function rizom(): Plugin {
	return {
		name: 'rizom',
		config(): UserConfig {
			return {
				server: {
					watch: {
						ignored: ['./src/config/**']
					}
				},
				build: {
					rollupOptions: {
						external: ['./src/lib/rizom.config.browser.js']
					}
				}
			};
		}
	};
}
