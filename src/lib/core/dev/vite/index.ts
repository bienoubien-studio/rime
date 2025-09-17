import type { Plugin } from 'vite';

/**
 * Vite plugin that serves the browser config as a virtual module
 * This way file imports works without package.json export error
 * Caveats : Vite will not optimize imported modules, so if an error
 * occured, the module should be added to vite config optimizeDeps.include
 */
export function rizom(): Plugin {
	const virtualModuleId = '$rizom/config';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: 'rizom-config',

		// configureServer(server) {
		// 	// Watch the .rizom directory for changes
		// 	const rizomDir = path.resolve(process.cwd(), '.rizom');
		// 	server.watcher.add(path.join(rizomDir, '**'));
		// },

		async handleHotUpdate({ server, file }) {
			if (file.includes('src/lib/core/config/build')) {
				const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
				if (module) {
					server.moduleGraph.invalidateModule(module);
					return [module];
				}
			}
		},

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},

		load(id) {
			if (id === resolvedVirtualModuleId) {
				const relativePath =
					this.environment?.config?.consumer === 'server'
						? '$lib/core/config/build/server/index.server.js'
						: '$lib/core/config/build/client/index.js';
				// Return import statement - let Vite handle TypeScript transpilation
				return `export * from '${relativePath}';`;
			}
		}
	};
}
