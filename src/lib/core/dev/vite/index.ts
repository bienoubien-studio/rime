import dotenv from 'dotenv';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { Plugin, UserConfig } from 'vite';
import { logger } from '../../logger/index.server.js';
import { hasRunInitCommand } from '../cli/util.server.js';
import { sanitize } from '../generate/sanitize/index.js';

dotenv.config({ override: true });
const dev = process.env.NODE_ENV === 'development';

export function rizom(): Plugin {
	const VCoreId = 'rizom:core';
	const VConfigClientId = 'rizom:config-client';
	const VConfigServerId = 'rizom:config';

	const resolvedVModule = (name: string) => '\0' + name;

	return {
		name: 'virtual-rizom',

		configureServer(server) {
			// Add a listener for when the server starts
			server.httpServer?.once('listening', () => {
				if (dev && !hasRunInitCommand()) {
					throw new Error('Missing required files, run `npx rizom init`');
				}
				// Check if we need to rebuild
				const shouldRebuild = process.argv.includes('rebuild');
				const rizomDevCacheDir = path.resolve(process.cwd(), '.rizom');
				if (shouldRebuild && existsSync(rizomDevCacheDir)) {
					rmSync(rizomDevCacheDir, { recursive: true, force: true });
				}
			});

			// Add a watcher for config changes
			// Whenever any change in src/config trigger
			// a dummy request to retrigger the configuration build
			server.watcher.on('change', async (path) => {
				if (path.includes('src/lib/config') && !path.includes('src/lib/config.generated')) {
					try {
						await sanitize();
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
		},

		async handleHotUpdate({ server, file }) {
			function invalidateVModule(moduleId: string) {
				const module = server.moduleGraph.getModuleById(resolvedVModule(moduleId));
				if (module) {
					server.moduleGraph.invalidateModule(module);
					return module;
				}
				return null;
			}

			if (file.includes('config.generated/rizom.config.server')) {
				logger.info('reload config server');
				const module = invalidateVModule(VConfigServerId);
				if (module) return [module];
			} else if (file.includes('config.generated/rizom.config')) {
				logger.info('reload config client');
				const module = invalidateVModule(VConfigClientId);
				if (module) return [module];
			}

			if (file.includes('src/lib/core/config')) {
				logger.info('reload core config');
				const module = invalidateVModule(VCoreId);
				if (module) return [module];
			}
		},

		resolveId(id) {
			if (id === VCoreId) {
				return resolvedVModule(id);
			}
			if (id === VConfigClientId) {
				return resolvedVModule(id);
			}
			if (id === VConfigServerId) {
				return resolvedVModule(id);
			}

			return null;
		},

		load(id) {
			const isServer = this.environment?.config?.consumer === 'server';

			if (id === resolvedVModule(VCoreId)) {
				const corePath = isServer ? '$lib/core/config/server/index.server.js' : '$lib/core/config/client/index.js';
				return `export * from '${corePath}';`;
			}

			if (id === resolvedVModule(VConfigClientId)) {
				const configPath = '$lib/config.generated/rizom.config.js';
				return `import config from '${configPath}';\nexport default config`;
			}

			if (id === resolvedVModule(VConfigServerId)) {
				const configPath = '$lib/config.generated/rizom.config.server.js';
				return `import config from '${configPath}';\nexport default config`;
			}

			return null;
		}
	};
}
