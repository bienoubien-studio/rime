import {
	buildCollection,
	mergePanelUsersCollectionWithDefault
} from './collection/index.server.js';
import { access } from '$lib/util/access/index.js';
import type {
	BuiltCollection,
	BuiltConfig,
	BuiltArea,
	CompiledConfig,
	Config
} from '$lib/types/config.js';
import { RizomError } from '$lib/errors/index.js';
import type { Dic } from '$lib/types/util.js';
import { buildArea } from './area/index.server.js';
import { registerPlugins } from './plugins.server.js';
import { compileConfig } from '../compile.server.js';
import { buildComponentsMap } from './fields/componentMap.js';
import { cache } from '$lib/plugins/cache/index.js';
import { mailer } from '$lib/plugins/mailer/index.server.js';
import { hasProp } from '$lib/util/object.js';
import { BookType, SlidersVertical } from '@lucide/svelte';
import { PANEL_USERS } from '$lib/constant.js';

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

	let collections: BuiltCollection[] = [];
	let areas: BuiltArea[] = [];
	const icons: Dic = {};

	/////////////////////////////////////////////
	// Retrieve Default Users collection
	//////////////////////////////////////////////
	const panelUsersCollection = mergePanelUsersCollectionWithDefault(config.panel?.users);
	config.collections = [
		...config.collections.filter((c) => c.slug !== PANEL_USERS),
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
			navigation: config.panel?.navigation || {
				groups: [
					{ label: 'content', icon: BookType },
					{ label: 'system', icon: SlidersVertical }
				]
			},
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
	// Core plugins that includes handlers should be added also here :
	// src/lib/handlers/plugins.server.ts
	// because the config is built from inside the first handler
	// if a plugin includes a handler, the handler should be register there before
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

	/////////////////////////////////////////////
	// Generate files
	//////////////////////////////////////////////

	let genCache;
	if(dev){
		genCache = await import( '../../bin/generate/cache/index.js').then(m => m.default)
		genCache.set('.gen', '');
	}

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

	if(genCache){
		genCache.delete('.gen');
	}

	if (!compiled) {
		return builtConfig as C extends true ? CompiledConfig : BuiltConfig;
	}

	return compiledConfig as C extends true ? CompiledConfig : BuiltConfig;
};

export { buildConfig };


