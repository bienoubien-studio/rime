import { type Handle } from '@sveltejs/kit';
import { cache } from '$lib/plugins/cache/index.js';
import type { Config } from '$lib/types/index.js';

type Args = { config: Config };

export function createPluginsHandler({ config }: Args) {
	const pluginHandlers: Handle[] = [];

	// Should re-pass mandatory plugins here as the config is not built
	// at this point and making it built would prevent config reload/rebuilt
	// it's ugly but it works
	const plugins = [cache(config.cache || {}), ...(config.plugins || [])];

	for (const plugin of plugins) {
		if (plugin.handler) {
			pluginHandlers.push(plugin.handler);
		}
	}

	return pluginHandlers;
}
