import type { Plugin, UserConfig } from 'vite';
import { browserConfig } from './browser.js';
import dotenv from 'dotenv';
import { existsSync, rmSync } from 'fs';
import path from 'path';
import { hasRunInitCommand } from '../cli/util.server.js';

dotenv.config({ override: true });
const dev = process.env.NODE_ENV === 'development';

export function rizom(): Plugin[] {
	return [{
		name: 'rizom',
		configureServer(server) {
			// Add a listener for when the server starts
			server.httpServer?.once('listening', () => {
				if (dev && !hasRunInitCommand()) {
					throw new Error('Missing required files, run `npx rizom init`');
				}
				// Check if we need to rebuild
				const shouldRebuild = process.argv.includes('rebuild');
				const rizomDevCacheDir = path.resolve(process.cwd(), '.rizom')
				if (shouldRebuild && existsSync(rizomDevCacheDir)) {
					rmSync(rizomDevCacheDir, { recursive: true, force: true })
				}
			});

			// Add a watcher for config changes
			// Whenever any change in src/config trigger 
			// a dummy request to retrigger the configuration build
			server.watcher.on('change', async (path) => {
				if (path.includes('src/config')) {
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
					external: ['sharp', 'better-sqlite3']
				},
				optimizeDeps: { 
					exclude: ['sharp', 'better-sqlite3'],
					include: ['@lucide/svelte']
				},
				build: {
					rollupOptions: {
						external: ['better-sqlite3', 'sharp']
					},
					target: 'es2022'
				}
			};
		}
	}, browserConfig()];
}
