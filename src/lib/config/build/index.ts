import { buildCollection, mergePanelUsersCollectionWithDefault } from './collection.server.js';
import { access } from 'rizom/utils/access/index.js';
import type {
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltGlobalConfig,
	CompiledConfig,
	Config
} from 'rizom/types/config.js';
import { RizomError } from 'rizom/errors/error.server.js';
import type { Dic } from 'rizom/types/utility.js';
import { buildGlobal } from './global.server.js';
import { registerPlugins } from './plugins.server.js';
import { compileConfig } from '../compile.server.js';
import { buildComponentsMap } from './fields/componentMap.js';

type BuildConfig = (config: Config, options?: { generate: boolean }) => Promise<CompiledConfig>;

const dev = process.env.NODE_ENV === 'development';

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

	const collectionFields = builtConfig.collections.flatMap((collection) => collection.fields);
	const globalFields = builtConfig.globals.flatMap((global) => global.fields);

	let fieldsComponentsMap = buildComponentsMap([...collectionFields, ...globalFields]);

	/////////////////////////////////////////////
	// Plugins
	//////////////////////////////////////////////
	if (config.plugins) {
		const { pluginsFieldsComponents, builtConfigWithPlugins } = registerPlugins({
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

	const compiledConfig = compileConfig(builtConfig);

	if (dev || generate) {
		const writeMemo = await import('./write.js').then((module) => module.default);
		const changed = writeMemo(compiledConfig);

		if (changed) {
			const validate = await import('../validate.js').then((module) => module.default);
			const valid = validate(compiledConfig);
			if (!valid) {
				throw new RizomError('Config not valid');
			}

			if (generate) {
				const generateSchema = await import('rizom/config/generate/schema/index.js').then(
					(m) => m.default
				);
				const generateRoutes = await import('rizom/config/generate/routes/index.js').then(
					(m) => m.default
				);
				const generateTypes = await import('rizom/config/generate/types/index.js').then(
					(m) => m.default
				);
				const generateBrowserConfig = await import('rizom/config/generate/browser/index.js').then(
					(m) => m.default
				);
				generateBrowserConfig({
					...compiledConfig,
					blueprints: fieldsComponentsMap
				});
				generateSchema(builtConfig);
				generateRoutes(builtConfig);
				generateTypes(builtConfig);
			}
		}
	}

	return compiledConfig;
};

export { buildConfig };
