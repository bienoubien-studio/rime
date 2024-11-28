import { buildCollection, mergePanelUsersCollectionWithDefault } from './collection.server.js';
import { compile } from './fields/compile.server.js';
import { access } from 'rizom/access/index.js';
import { augment } from './fields/augment.server.js';
import buildBrowserConfig from './browserConfig.js';
import generateSchema from 'rizom/bin/schema/index.js';
import generateRoutes from 'rizom/bin/routes/index.js';
import generateTypes from 'rizom/bin/types/index.js';
import type { AnyField } from 'rizom/types/fields.js';
import type {
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltGlobalConfig,
	Config,
	GlobalConfig
} from 'rizom/types/config.js';
import type { PrototypeSlug } from 'rizom/types/doc.js';
import { RizomError } from 'rizom/errors/error.server.js';
import type { Dic } from 'rizom/types/utility.js';
import { capitalize } from 'rizom/utils/string.js';
import { findTitleField } from './fields/findTitle.server.js';

const dev = process.env.NODE_ENV === 'development';
const execFromCommandLine =
	process.env.npm_lifecycle_script && !process.env.npm_lifecycle_script.includes('vite dev');

/**
 * Add extra configuration to Globals and Collections
 */
const buildConfig = async (config: Config): Promise<BuiltConfig> => {
	let collections: BuiltCollectionConfig[] = [];
	let globals: BuiltGlobalConfig[] = [];
	const icons: Dic = {};

	const panelUsersCollection = mergePanelUsersCollectionWithDefault(config.panel?.users);
	config.collections = [
		...config.collections.filter((c) => c.slug !== 'users'),
		panelUsersCollection
	];

	for (const collection of [...config.collections]) {
		const buildedCollection = await buildCollection(collection);
		collections = [...collections, buildedCollection];
		if (collection.icon) icons[collection.slug] = collection.icon;
	}

	for (const global of config.globals) {
		globals = [...globals, buildGlobal(global)];
		if (global.icon) icons[global.slug] = global.icon;
	}

	if (config.panel?.routes) {
		for (const [route, routeConfig] of Object.entries(config.panel.routes)) {
			if (routeConfig.icon) {
				icons[`custom-${route}`] = routeConfig.icon;
			}
		}
	}

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

	if (config.plugins) {
		for (const plugin of config.plugins) {
			if ('configure' in plugin) {
				builtConfig = plugin.configure!(builtConfig);
			}
			if ('routes' in plugin) {
				builtConfig.routes = {
					...(builtConfig.routes || {}),
					...plugin.routes
				};
			}
		}
		builtConfig.plugins = Object.fromEntries(
			config.plugins.map((plugin) => [plugin.name, plugin.actions || {}])
		);
	}

	if (dev) {
		if (!execFromCommandLine) {
			const writeMemo = await import('./write.js').then((module) => module.default);
			const changed = writeMemo(builtConfig);

			if (changed) {
				const validate = await import('../validate.js').then((module) => module.default);
				const valid = validate(builtConfig);

				if (valid) {
					buildBrowserConfig(builtConfig);
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
	}

	return builtConfig;
};

/**
 * Add extra fields to Global
 */
const buildGlobal = (global: GlobalConfig): BuiltGlobalConfig => {
	const fields: AnyField[] = [
		...global.fields.reduce(compile, []).reduce(augment, []),
		{ name: 'updatedAt', type: 'date', hidden: true }
	];

	const fieldTitle = findTitleField(fields);

	return {
		...global,
		slug: global.slug as PrototypeSlug,
		type: 'global',
		label: global.label ? global.label : capitalize(global.slug),
		asTitle: fieldTitle ? fieldTitle.name : 'id',
		fields,
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...global.access
		}
	};
};

export { buildConfig };
