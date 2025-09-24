import type { BuiltConfig, BuiltConfigClient } from '$lib/core/config/types.js';
import type { PluginClient } from '$lib/core/types/plugins.js';

export const registerPluginsClient = <T extends BuiltConfigClient | BuiltConfig>(args: {
	plugins: ReturnType<PluginClient>[];
	builtConfig: T;
}) => {
	if (!args.plugins || !args.plugins.length) return args.builtConfig;

	let builtConfig = args.builtConfig as T;

	for (const plugin of args.plugins) {
		if ('configure' in plugin && typeof plugin.configure === 'function') {
			builtConfig = plugin.configure(builtConfig);
		}
	}

	return {
		...builtConfig,
		plugins: args.plugins.filter((p) => p.type === 'client')
	};
};
