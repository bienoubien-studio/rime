import { buildCollection, mergePanelUsersCollectionWithDefault } from './collection.server.js';
import { access } from 'rizom/utils/access/index.js';
import type {
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltAreaConfig,
	CompiledConfig,
	Config
} from 'rizom/types/config.js';
import { RizomError } from 'rizom/errors/index.js';
import type { Dic } from 'rizom/types/utility.js';
import { buildArea } from './area.server.js';
import { registerPlugins } from './plugins.server.js';
import { compileConfig } from '../compile.server.js';
import { buildComponentsMap } from './fields/componentMap.js';
import genCache from '../../bin/generate/cache/index.js';
import { cache } from 'rizom/plugins/cache/index.js';

type BuildConfig = <C extends boolean = true>(
	config: Config,
	options?: { generateFiles?: boolean; compiled?: C }
) => C extends true ? Promise<CompiledConfig> : Promise<BuiltConfig>;

const dev = process.env.NODE_ENV === 'development';

/**
 * Add extra configuration to Areas and Collections
 */

const buildConfig = async <C extends boolean = true>(
	config: Config,
	options: { generateFiles?: boolean; compiled?: C }
): Promise<C extends true ? CompiledConfig : BuiltConfig> => {
	const generateFiles = options?.generateFiles || false;
	const compiled = options?.compiled || true;

	let collections: BuiltCollectionConfig[] = [];
	let areas: BuiltAreaConfig[] = [];
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
	// Build area
	//////////////////////////////////////////////
	for (const area of config.areas) {
		areas = [...areas, buildArea(area)];
		// add icon to iconMap
		if (area.icon) icons[area.slug] = area.icon;
	}

	// Add Routes icon to iconMap
	if (config.panel?.routes) {
		for (const [route, routeConfig] of Object.entries(config.panel.routes)) {
			if (routeConfig.icon) {
				icons[`custom-${route}`] = routeConfig.icon;
			}
		}
	}

	const trustedOrigins =
		'trustedOrigins' in config && Array.isArray(config.trustedOrigins)
			? config.trustedOrigins
			: [process.env.PUBLIC_RIZOM_URL as string];

	// Set base builtConfig
	let builtConfig: BuiltConfig = {
		...config,
		panel: {
			access: config.panel?.access ? config.panel.access : (user) => access.isAdmin(user),
			routes: config.panel?.routes ? config.panel.routes : {},
			language: config.panel?.language || 'en',
			components: {
				header: config.panel?.components?.header || [],
				...(config.panel?.components?.dashboard && { dashboard: config.panel.components.dashboard })
			}
		},
		collections,
		plugins: {},
		areas,
		trustedOrigins,
		icons
	};

	const collectionFields = builtConfig.collections.flatMap((collection) => collection.fields);
	const areaFields = builtConfig.areas.flatMap((area) => area.fields);

	let fieldsComponentsMap = buildComponentsMap([...collectionFields, ...areaFields]);

	/////////////////////////////////////////////
	// Plugins
	//////////////////////////////////////////////

	// IMPORTANT !
	// Mandatory plugins that includes handlers should be added also here :
	// src/lib/handlers/plugins.server.ts
	// to register handlers as the config is built from inside the first handler
	// in order to reload/rebuild on refresh if dev mode
	const plugins = [cache(config.cache || {}), ...(config.plugins || [])];

	const { pluginsFieldsComponents, builtConfigWithPlugins } = registerPlugins({
		plugins,
		builtConfig
	});
	builtConfig = builtConfigWithPlugins;
	fieldsComponentsMap = {
		...pluginsFieldsComponents,
		...fieldsComponentsMap
	};

	/////////////////////////////////////////////
	// Generate files
	//////////////////////////////////////////////

	genCache.set('.gen', '');

	const compiledConfig = compileConfig(builtConfig);

	if (dev || generateFiles) {
		const writeMemo = await import('./write.js').then((module) => module.default);
		const changed = writeMemo(compiledConfig);

		if (changed) {
			const validate = await import('../validate.js').then((module) => module.default);
			const valid = validate(compiledConfig);
			if (!valid) {
				throw new RizomError('Config not valid');
			}

			if (generateFiles) {
				const generateSchema = await import('rizom/bin/generate/schema/index.js').then(
					(m) => m.default
				);
				const generateRoutes = await import('rizom/bin/generate/routes/index.js').then(
					(m) => m.default
				);
				const generateTypes = await import('rizom/bin/generate/types/index.js').then(
					(m) => m.default
				);
				const generateBrowserConfig = await import('rizom/bin/generate/browser/index.js').then(
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

	genCache.delete('.gen');

	if (!compiled) {
		return builtConfig as C extends true ? CompiledConfig : BuiltConfig;
	}

	return compiledConfig as C extends true ? CompiledConfig : BuiltConfig;
};

export { buildConfig };

const foo = buildConfig({ collections: [], areas: [], database: 'foo' }, { compiled: true });
