import { type Handle } from '@sveltejs/kit';
import type { Config } from 'rizom/types/index.js';

type Args = { config: Config };

export function createPluginsHandler({ config }: Args) {
	const pluginHandlers: Handle[] = [];

	if (config.plugins) {
		for (const plugin of config.plugins) {
			if (plugin.handler) {
				pluginHandlers.push(plugin.handler);
			}
		}
	}

	return pluginHandlers;
}
