import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { logger } from '../../logger/index.server.js';

/**
 * Vite plugin that serves the browser config as a virtual module
 * This way file imports works without package.json export error
 * Caveats : Vite will not optimize imported modules, so if an error
 * occured, the module should be added to vite config optimizeDeps.include
 */
export function browserConfig(): Plugin {
	const virtualModuleId = 'virtual:browser-config';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: 'rizom:browser-config',

		configureServer(server) {
			// Watch the .rizom directory for changes
			const rizomDir = path.resolve(process.cwd(), '.rizom');
			server.watcher.add(path.join(rizomDir, '**'));
		},

		async handleHotUpdate({ server, file }) {
			if (file.includes('config.browser.txt')) {
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
				try {
					// Path to the generated browser config
					const configPath = path.resolve(process.cwd(), '.rizom/config.browser.txt');

					if (fs.existsSync(configPath)) {
						// Read and return the content of the browser config
						return fs.readFileSync(configPath, 'utf-8');
					} else {
						logger.warn('Browser config file not found at:', configPath);
						return 'export default {}';
					}
				} catch (error) {
					logger.error('Error loading browser config:', error);
					return 'export default {}';
				}
			}
		}
	};
}
