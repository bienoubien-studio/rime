import type { BuiltConfig } from '$lib/core/config/types.js';
import type { Plugin } from '$lib/types.js';

type AnyPlugin = ReturnType<Plugin>;

export const registerPlugins = <T extends AnyPlugin>(args: { plugins: T[]; builtConfig: BuiltConfig }) => {
	if (!args.plugins || !args.plugins.length) return args.builtConfig;

	let builtConfigServer = args.builtConfig as BuiltConfig;

	for (const plugin of args.plugins) {
		if ('configure' in plugin && typeof plugin.configure === 'function') {
			builtConfigServer = plugin.configure(builtConfigServer);
		}

		// Register routes
		if ('routes' in plugin && typeof plugin.routes === 'object') {
			builtConfigServer.$routes = {
				...(builtConfigServer.$routes || {}),
				...plugin.routes
			};
		}
	}

	return {
		...builtConfigServer,
		$plugins: args.plugins
	};
};
