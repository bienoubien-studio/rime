import { buildCollection, mergePanelUsersCollectionWithDefault } from './collection.server.js';
import { access } from 'rizom/utils/access/index.js';
import generateBrowserConfig from 'rizom/config/generate/browser/index.js';
import generateSchema from 'rizom/config/generate/schema/index.js';
import generateRoutes from 'rizom/config/generate/routes/index.js';
import generateTypes from 'rizom/config/generate/types/index.js';
import type {
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltGlobalConfig,
	Config
} from 'rizom/types/config.js';
import { RizomError } from 'rizom/errors/error.server.js';
import type { Dic } from 'rizom/types/utility.js';
import { buildGlobal } from './global.server.js';
import { registerPlugins } from './plugins.server.js';
import { componentsMap } from 'rizom/fields/components.js';
import type { FieldsComponents } from 'rizom/types/panel.js';

type BuildConfig = (config: Config, options?: { generate: boolean }) => Promise<BuiltConfig>;

/**
 * Add extra configuration to Globals and Collections
 */

const buildConfig: BuildConfig = async (config: Config, { generate } = { generate: false }) => {
	let collections: BuiltCollectionConfig[] = [];
	let globals: BuiltGlobalConfig[] = [];
	const icons: Dic = {};

	/////////////////////////////////////////////
	// Retrieve Default Users collection
	//////////////////////////////////////////////
	const panelUsersCollection = mergePanelUsersCollectionWithDefault(config.panel?.users);
	config.collections = [
		...config.collections.filter((c) => c.slug !== 'users'),
		panelUsersCollection
	];

	/////////////////////////////////////////////
	// Build Collections
	//////////////////////////////////////////////
	for (const collection of [...config.collections]) {
		const buildedCollection = await buildCollection(collection);
		collections = [...collections, buildedCollection];
		// add icon to iconMap
		if (collection.icon) icons[collection.slug] = collection.icon;
	}

	/////////////////////////////////////////////
	// Build global
	//////////////////////////////////////////////
	for (const global of config.globals) {
		globals = [...globals, buildGlobal(global)];
		// add icon to iconMap
		if (global.icon) icons[global.slug] = global.icon;
	}

	// Add Routes icon to iconMap
	if (config.panel?.routes) {
		for (const [route, routeConfig] of Object.entries(config.panel.routes)) {
			if (routeConfig.icon) {
				icons[`custom-${route}`] = routeConfig.icon;
			}
		}
	}

	// Set base builtConfig
	let builtConfig: BuiltConfig = {
		...config,
		panel: {
			access: config.panel?.access ? config.panel.access : (user) => access.isAdmin(user),
			routes: config.panel?.routes ? config.panel.routes : {}
		},
		collections,
		plugins: {},
		globals,
		icons
	};

	let fieldsComponentsMap: Record<string, FieldsComponents> = { ...componentsMap };

	/////////////////////////////////////////////
	// Plugins
	//////////////////////////////////////////////
	if (config.plugins) {
		const { builtConfigWithPlugins } = registerPlugins({
			plugins: config.plugins,
			builtConfig
		});
		builtConfig = builtConfigWithPlugins;
		fieldsComponentsMap = {
			...pluginsFieldsComponents,
			...fieldsComponentsMap
		};
	}

	/////////////////////////////////////////////
	// Generate files
	//////////////////////////////////////////////

	if (generate) {
		const writeMemo = await import('./write.js').then((module) => module.default);
		const changed = writeMemo(builtConfig);
		if (changed) {
			const validate = await import('../validate.js').then((module) => module.default);
			const valid = validate(builtConfig);

			if (valid) {
				generateBrowserConfig({ ...builtConfig, blueprints: fieldsComponentsMap });
				generateSchema(builtConfig);
				generateRoutes(builtConfig);
				generateTypes(builtConfig);
			} else {
				throw new RizomError('Config not valid');
			}
		}
	} else {
		const validate = await import('../validate.js').then((module) => module.default);
		validate(builtConfig);
	}

	return builtConfig;
};

export { buildConfig };
