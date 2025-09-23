import { dev } from '$app/environment';
import generateSchema from '$lib/adapter-sqlite/generate-schema/index.server.js';
import * as Area from '$lib/core/areas/config/builder.server.js';
import * as Collection from '$lib/core/collections/config/builder.server.js';
import devCache from '$lib/core/dev/cache/index.js';
import generateRoutes from '$lib/core/dev/generate/routes/index.js';
import generateTypes from '$lib/core/dev/generate/types/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import { apiInit } from '$lib/core/plugins/api-init/index.server.js';
import { cacheClient } from '$lib/core/plugins/cache/index.js';
import { cache } from '$lib/core/plugins/cache/index.server.js';
import { mailer } from '$lib/core/plugins/mailer/index.server.js';
import { sse } from '$lib/core/plugins/sse/index.server.js';
import type { BuiltArea, BuiltCollection, BuiltConfigClient, Config, User } from '$lib/types.js';
import { access } from '$lib/util/index.js';
import { hasProp } from '$lib/util/object.js';
import type { Dic } from '$lib/util/types.js';
import { Book, BookCopy, BookType, SlidersVertical, type IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import { compileConfig } from '../shared/compile.js';
import { registerPluginsClient } from '../shared/register-plugins.js';
import { registerPlugins } from '../shared/register-plugins.server.js';
import { buildStaffCollection } from '../shared/staff.js';
import { makeUploadDirectoriesCollections } from '../shared/upload-directories.js';
import { makeVersionsCollectionsAliases } from '../shared/versions-alias.server.js';
import type { BuiltConfig, SanitizedConfigClient } from '../types.js';
import validate from './validate.js';
import writeMemo from './write.js';

type ConfigWithBuiltPrototypes = Omit<Config, 'collections' | 'areas'> & {
	collections: BuiltCollection[];
	areas: BuiltArea[];
};

const buildConfig = (config: ConfigWithBuiltPrototypes): BuiltConfig => {
	const icons: Dic<Component<IconProps>> = {};

	const staff = buildStaffCollection(config.staff);

	// Add icons
	for (const collection of [staff, ...config.collections]) {
		icons[collection.slug] = collection.icon;
	}
	for (const area of config.areas) {
		icons[area.slug] = area.icon;
	}

	const panelNavigationGroups = [
		...(config.panel?.navigation?.groups || []),
		{ label: 'content', icon: BookType },
		{ label: 'system', icon: SlidersVertical },
		{ label: 'collections', icon: BookCopy },
		{ label: 'areas', icon: Book }
	];

	const trustedOrigins =
		'trustedOrigins' in config && Array.isArray(config.trustedOrigins)
			? config.trustedOrigins
			: [process.env.PUBLIC_RIZOM_URL as string];

	const corePluginsServer = [
		// Cache plugin with default enabled only if there is no user
		cache(config.$cache || {}),
		// Server Sent Event
		sse(),
		// Add init plugins in dev mode
		...(dev ? [apiInit()] : []),
		// Mailer plugin
		...(hasProp('$smtp', config) ? [mailer(config.$smtp)] : [])
	];

	const baseBuiltConfig: BuiltConfig = {
		...config,
		$database: config.$database,
		$trustedOrigins: trustedOrigins,
		collections: [staff, ...config.collections],
		areas: config.areas,
		panel: {
			$access: config.panel?.$access ? config.panel.$access : (user?: User) => access.isAdmin(user),
			routes: config.panel?.routes ? config.panel.routes : {},
			language: config.panel?.language || 'en',
			navigation: { groups: panelNavigationGroups },
			components: {
				header: config.panel?.components?.header || [],
				...(config.panel?.components?.dashboard && { dashboard: config.panel.components.dashboard })
			}
		},
		icons
	};

	let builtConfig = registerPlugins({
		plugins: [...corePluginsServer, ...(config.$plugins || [])],
		builtConfig: baseBuiltConfig
	});

	builtConfig = registerPluginsClient({
		plugins: [cacheClient(), ...(config.plugins || [])],
		builtConfig
	});

	if (dev) {
		const compiledConfig = compileConfig(builtConfig);
		const changed = writeMemo(compiledConfig);

		if (changed) {
			const valid = validate(compiledConfig);
			if (!valid) {
				throw new RizomError('Config not valid');
			}

			generateRoutes(builtConfig);

			devCache.set('.generating', new Date().toISOString());
			generateSchema(builtConfig).then(() => {
				generateTypes(builtConfig).then(() => {
					setTimeout(() => {
						devCache.delete('.generating');
					}, 2000);
				});
			});
		}
	}

	// Versions collection aliases
	// create {slug}_versions collections
	builtConfig = makeVersionsCollectionsAliases(builtConfig);
	// Upload collection directories
	// create {slug}_directories collections
	builtConfig = makeUploadDirectoriesCollections(builtConfig);

	return builtConfig;
};

/** placeholder for types */
const buildConfigClient = (config: SanitizedConfigClient): BuiltConfigClient => {
	throw new Error("Don't use this function, this is a placeholder for types only");
	// @ts-expect-error this is a placeholder function
	return config;
};

export { Area, buildConfig, buildConfigClient, Collection, Hooks };
