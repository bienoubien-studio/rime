import type { Plugin, ViteDevServer } from 'vite';

export function sanitize(): Plugin {

	// const virtualModuleId = 'virtual:browser-config';
	// const resolvedVirtualModuleId = '\0' + virtualModuleId;
	let server: ViteDevServer

	return {
		name: 'rizom:browser-config',

		enforce: 'pre',

		configureServer(_server) {
			server = _server
		},
		
		resolveId(id) {
			const isSSR = this.environment.config.consumer === 'server'
			if(!isSSR && id.includes('rizom.config')){
				return id
			}
		},

		load(id) {
			const isSSR = this.environment.config.consumer === 'server'
			if (!isSSR && id.includes('rizom.config')) {
				console.log(this.getModuleInfo(id))
				return id
				// console.log(server.moduleGraph.getModuleById(id))
			}
		}
	};
}
