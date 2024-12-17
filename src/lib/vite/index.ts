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
				optimizeDeps: {
					exclude: ['@node-rs/argon2']
				},
				build: {
					rollupOptions: {
						external: ['@node-rs/bcrypt', '@node-rs/argon2', './src/lib/rizom.config.browser.js']
					}
				}
			};
		}
	};
}
