import type { Plugin } from 'vite';

/**
 * Vite plugin that serves the browser config as a virtual module
 * This way file imports works without package.json export error
 * Caveats : Vite will not optimize imported modules, so if an error
 * occured, the module should be added to vite config optimizeDeps.include
 */
export function rizom(): Plugin {
	const virtualCoreId = '$rizom/core';
	const resolvedVirtualCoreId = '\0' + virtualCoreId;

	const virtualConfigClientId = '$rizom/config-client';
	const resolvedVirtualConfigClientId = '\0' + virtualConfigClientId;

	const virtualConfigServerId = '$rizom/config';
	const resolvedVirtualConfigServerId = '\0' + virtualConfigServerId;

	return {
		name: 'rizom-config',

		// configureServer(server) {
		// 	// Watch the .rizom directory for changes
		// 	const rizomDir = path.resolve(process.cwd(), '.rizom');
		// 	server.watcher.add(path.join(rizomDir, '**'));
		// },

		async handleHotUpdate({ server, file }) {
			if (file.includes('src/lib/core/config')) {
				const module = server.moduleGraph.getModuleById(resolvedVirtualCoreId);
				if (module) {
					server.moduleGraph.invalidateModule(module);
					return [module];
				}
			}
		},

		resolveId(id) {
			if (id === virtualCoreId) {
				return resolvedVirtualCoreId;
			}
			if (id === virtualConfigClientId) {
				return resolvedVirtualConfigClientId;
			}
			if (id === virtualConfigServerId) {
				return resolvedVirtualConfigServerId;
			}
		},

		load(id) {
			if (id === resolvedVirtualCoreId) {
				const relativePath =
					this.environment?.config?.consumer === 'server'
						? '$lib/core/config/server/index.server.js'
						: '$lib/core/config/client/index.js';
				// Return import statement - let Vite handle TypeScript transpilation
				return `export * from '${relativePath}';`;
			}
			if (id === resolvedVirtualConfigClientId) {
				const configPath = '$lib/config/.generated/index.js';
				return `/** client */
				import config from '${configPath}';
				export default config`;
			}
			if (id === resolvedVirtualConfigServerId) {
				const configPath = '$lib/config/.generated/index.server.js';
				return `/** server */
				import config from '${configPath}';
				export default config`;
			}
		}
	};
}
