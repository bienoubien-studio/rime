import { buildCollection, mergePanelUsersCollectionWithDefault } from './collection.server.js';
import { access } from 'rizom/access/index.js';
import buildBrowserConfig from './browserConfig.js';
import generateSchema from 'rizom/bin/schema/index.js';
import generateRoutes from 'rizom/bin/routes/index.js';
import generateTypes from 'rizom/bin/types/index.js';
import type {
	BuiltCollectionConfig,
	BuiltConfig,
	BuiltGlobalConfig,
	Config
} from 'rizom/types/config.js';
import { RizomError } from 'rizom/errors/error.server.js';
import type { Dic } from 'rizom/types/utility.js';
import * as blueprints from 'rizom/fields/blueprints.js';
import { buildGlobal } from './global.server.js';
import { registerPlugins } from './plugins.server.js';

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
		blueprints,
		globals,
		icons
	};

	/////////////////////////////////////////////
	// Plugins
	//////////////////////////////////////////////
	if (config.plugins) {
		builtConfig = registerPlugins({ plugins: config.plugins, builtConfig });
	}

	/////////////////////////////////////////////
	// Generate files
	//////////////////////////////////////////////
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

export { buildConfig };
