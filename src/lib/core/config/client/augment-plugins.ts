import { cacheClient } from '$lib/core/plugins/cache';
import type { SanitizedConfigClient } from '../types';

export const augmentPlugins = <const T extends SanitizedConfigClient>(config: T) => {
	const plugins = [cacheClient(), ...(config.plugins || [])];

	for (const plugin of plugins) {
		if ('configure' in plugin && typeof plugin.configure === 'function') {
			config = plugin.configure(config);
		}
	}

	return {
		...config,
		plugins: plugins.filter((p) => p.type === 'client')
	} as const;
};
