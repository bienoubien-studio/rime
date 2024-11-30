import type { FieldBluePrint } from 'rizom/fields';
import type { AnyField, BuiltConfig, Config } from 'rizom/types';

type Args = {
	plugins: Config['plugins'];
	builtConfig: BuiltConfig;
};

export const registerPlugins = ({ plugins, builtConfig }: Args) => {
	for (const plugin of plugins!) {
		// register fields
		if ('fields' in plugin && Array.isArray(plugin.fields)) {
			const blueprints: Record<string, FieldBluePrint<AnyField>> = Object.fromEntries(
				plugin.fields.map((field) => [
					field.type,
					{
						component: field.component,
						toSchema: field.toSchema,
						toType: field.toType
					}
				])
			);
			builtConfig.blueprints = { ...builtConfig.blueprints, ...blueprints };
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
	// Register a plugin record making this available :
	// rizom.plugins.something.do()
	builtConfig.plugins = Object.fromEntries(
		plugins!.map((plugin) => [plugin.name, plugin.actions || {}])
	);

	return builtConfig;
};
