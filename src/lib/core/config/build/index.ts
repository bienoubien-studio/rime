import { access } from '$lib/util/access/index.js';
import type { BuiltCollection, BuiltConfig, BuiltArea, CompiledConfig, Config } from '$lib/core/config/types/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { Dic } from '$lib/util/types.js';
import { registerPlugins } from './plugins.server.js';
import { compileConfig } from '../compile.server.js';
import { buildComponentsMap } from './fields/componentMap.js';
import { cache } from '$lib/core/plugins/cache/index.js';
import { mailer } from '$lib/core/plugins/mailer/index.server.js';
import { hasProp } from '$lib/util/object.js';
import { Book, BookCopy, BookType, SlidersVertical } from '@lucide/svelte';
import { PANEL_USERS } from '$lib/core/constant.js';
import { makeVersionsCollectionsAliases } from './versions-alias.js';
import { mergePanelUsersCollectionWithDefault } from '$lib/core/collections/auth/config/usersConfig.server.js';
import { makeUploadDirectoriesCollections } from './upload-directories.js';

const dev = process.env.NODE_ENV === 'development';

/**
 * - Build config
 * - Optionnal generate schema / routes / types
 */
const buildConfig = async (config: Config, options: { generateFiles?: boolean }): Promise<CompiledConfig> => {
	const generateFiles = options?.generateFiles || false;
	const icons: Dic = {};

	// Retrieve Default Users collection and merge with defined panel user config
	const panelUsersCollection = mergePanelUsersCollectionWithDefault(config.panel?.users);
	config.collections = [...config.collections.filter((c) => c.slug !== PANEL_USERS), panelUsersCollection];

	// Add icons
	for (const collection of config.collections) {
		icons[collection.slug] = collection.icon;
	}
	for (const area of config.areas) {
		icons[area.slug] = area.icon;
	}

	// Add Routes icon to iconMap
	if (config.panel?.routes) {
		for (const [route, routeConfig] of Object.entries(config.panel.routes)) {
			if (routeConfig.icon) {
				icons[`custom-${route}`] = routeConfig.icon;
			}
		}
	}

	// Trusted origin used for CORS and Better-Auth
	const trustedOrigins =
		'trustedOrigins' in config && Array.isArray(config.trustedOrigins)
			? config.trustedOrigins
			: [process.env.PUBLIC_RIZOM_URL as string];

	const panelNavigationGroups = [
			...(config.panel?.navigation?.groups || []),
			{ label: 'content', icon: BookType },
			{ label: 'system', icon: SlidersVertical },
			{ label: 'collections', icon: BookCopy },
			{ label: 'areas', icon: Book }
		]
	
	/****************************************************/
	/* Base Config 
	/****************************************************/
	let builtConfig: BuiltConfig = {
		...config,
		panel: {
			access: config.panel?.access ? config.panel.access : (user) => access.isAdmin(user),
			routes: config.panel?.routes ? config.panel.routes : {},
			language: config.panel?.language || 'en',
			navigation: { groups : panelNavigationGroups},
			components: {
				header: config.panel?.components?.header || [],
				...(config.panel?.components?.dashboard && { dashboard: config.panel.components.dashboard })
			},
			css: config.panel?.css
		},
		collections: config.collections.map((c) => ({ ...c, type: 'collection' })) as BuiltCollection[],
		areas: config.areas.map((c) => ({ ...c, type: 'area' })) as BuiltArea[],
		plugins: {},
		trustedOrigins,
		icons
	};

	const collectionFields = builtConfig.collections.flatMap((collection) => collection.fields);
	const areaFields = builtConfig.areas.flatMap((area) => area.fields);

	let fieldsComponentsMap = buildComponentsMap([...collectionFields, ...areaFields]);

	/****************************************************
	 * Plugins
	 *
	 * IMPORTANT ! Core plugins that includes handlers should be added also here :
	 * src/lib/handlers/plugins.server.ts
	 * because the config is built from inside the first handler
	 * if a plugin includes a handler, the handler should be register there before...
	 */
	const corePlugins = [cache(config.cache || {})];
	if (hasProp('smtp', config)) {
		corePlugins.push(mailer(config.smtp));
	}
	const plugins = [...corePlugins, ...(config.plugins || [])];

	const { pluginsFieldsComponents, builtConfigWithPlugins } = registerPlugins({
		plugins,
		builtConfig
	});
	builtConfig = builtConfigWithPlugins;
	fieldsComponentsMap = {
		...pluginsFieldsComponents,
		...fieldsComponentsMap
	};

	/****************************************************
	/* Generate files
	/****************************************************/

	let compiledConfig = compileConfig(builtConfig);

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
				const generateSchema = await import('rizom/core/dev/generate/schema/index.js').then((m) => m.default);
				const generateRoutes = await import('rizom/core/dev/generate/routes/index.js').then((m) => m.default);
				const generateTypes = await import('rizom/core/dev/generate/types/index.js').then((m) => m.default);
				const generateBrowserConfig = await import('rizom/core/dev/generate/browser/index.js').then((m) => m.default);

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

	// Versions collection aliases 
	// create {slug}_versions collections
	compiledConfig = makeVersionsCollectionsAliases(compiledConfig);
	// Upload collection directories 
	// create {slug}_directories collections
	compiledConfig = makeUploadDirectoriesCollections(compiledConfig)

	return compiledConfig;
};

export { buildConfig };
