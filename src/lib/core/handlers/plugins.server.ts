import type { BuiltConfig } from '$lib/core/config/types.js';
import { type Handle } from '@sveltejs/kit';

type Args = { config: BuiltConfig };

export function createPluginsHandler({ config }: Args) {
	const pluginHandlers: Handle[] = [];

	for (const plugin of config.$plugins || []) {
		if (plugin.handler) {
			pluginHandlers.push(plugin.handler);
		}
	}

	return pluginHandlers;
}
