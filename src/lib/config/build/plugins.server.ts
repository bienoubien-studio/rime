import type { BuiltConfig, Config } from '$lib/types/config.js';
import type { FieldsComponents } from '$lib/types/panel.js';

type Args = {
	plugins: Config['plugins'];
	builtConfig: BuiltConfig;
};

export const registerPlugins = ({ plugins, builtConfig }: Args) => {
	let pluginsFieldsComponents: Record<string, FieldsComponents> = {};
	for (const plugin of plugins!) {
		// register fields
		if ('fields' in plugin && Array.isArray(plugin.fields)) {
			const pluginFieldsComponents: Record<string, FieldsComponents> = Object.fromEntries(
				plugin.fields.map((field) => [
					field.type,
					{
						component: field.component,
						cell: field.cell
					}
				])
			);
			pluginsFieldsComponents = { ...pluginsFieldsComponents, ...pluginFieldsComponents };
		}

		// Augment config
		if ('configure' in plugin) {
			builtConfig = plugin.configure!(builtConfig);
		}

		// Register routes
		if ('routes' in plugin) {
			builtConfig.routes = {
				...(builtConfig.routes || {}),
				...plugin.routes
			};
		}
	}
	// Register plugins actions making this available :
	// rizom.plugins.something.do()
	builtConfig.plugins = Object.fromEntries(
		plugins!.map((plugin) => [plugin.name, plugin.actions || {}])
	);

	return { builtConfigWithPlugins: builtConfig, pluginsFieldsComponents };
};
