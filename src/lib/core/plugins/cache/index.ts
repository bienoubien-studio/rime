import type { PluginClient } from '$lib/core/types/plugins.js';
import HeaderButton from './HeaderButton.svelte';

export const cacheClient: PluginClient = () => {
	return {
		name: 'cache/client',
		type: 'client',
		configure: (config) => {
			config = {
				...config,
				panel: {
					...(config.panel || {}),
					components: {
						...(config.panel.components || { header: [], collectionHeader: [] }),
						header: [...(config.panel.components?.header || []), HeaderButton]
					}
				}
			};
			return config;
		}
	};
};
