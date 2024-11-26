import path from 'path';
import { RizomError } from '../errors/error.server.js';
import { flattenWithGuard } from '../utils/object.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { buildConfig } from './build/index.js';
import { existsSync, mkdirSync } from 'fs';
import type { BuiltCollectionConfig, BuiltConfig, BuiltGlobalConfig } from 'rizom/types/config.js';
import type { AsyncReturnType, Dic } from 'rizom/types/utility.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createConfigInterface() {
	const flattenConfig = (config: BuiltConfig) => {
		return flattenWithGuard(config, {
			shouldFlat: ([key]) =>
				!['cors', 'plugins', 'routes', 'locales', 'globals', 'collections'].includes(key)
		});
	};

	const fullPathToConfig = path.resolve(process.cwd(), './src/config/rizom.config');
	const pathToconfig = path.relative(__dirname, fullPathToConfig);

	let config: BuiltConfig;
	try {
		config = await import(/* @vite-ignore */ pathToconfig)
			.then((module) => module.default)
			.then(async (rawConfig) => await buildConfig(rawConfig));
	} catch (err) {
		console.log(err);
		throw new Error("can't import config from " + pathToconfig);
	}

	let flatConfig: Dic = flattenConfig(config);

	// Initialize required upload folder
	const hasUpload = config.collections.some((collection) => !!collection.upload);
	if (hasUpload) {
		const staticDirectory = path.resolve(process.cwd(), 'static');
		if (!existsSync(staticDirectory)) {
			mkdirSync(staticDirectory);
		}
		const mediasDirectory = path.resolve(staticDirectory, 'medias');
		if (!existsSync(mediasDirectory)) {
			mkdirSync(mediasDirectory);
		}
	}

	const getGlobal = (slug: string): BuiltGlobalConfig | undefined => {
		return config.globals.find((g) => g.slug === slug);
	};

	const getCollection = (slug: string): BuiltCollectionConfig | undefined => {
		return config.collections.find((c) => c.slug === slug);
	};

	const getBySlug = (slug: string) => {
		return getGlobal(slug) || getCollection(slug);
	};

	const getDocumentPrototype = (slug: string) => {
		if (getCollection(slug)) {
			return 'collection';
		} else if (getGlobal(slug)) {
			return 'global';
		}
		throw new RizomError(slug + 'is neither a collection nor a globlal');
	};

	return {
		//
		get(path?: string) {
			if (!config) {
				throw new RizomError('config not loaded yet');
			}
			if (!path) return config;

			return path in flatConfig ? flatConfig[path] : null;
		},

		get collections() {
			return config.collections;
		},

		get globals() {
			return config.globals;
		},

		async reload() {
			// return;
			// taskLogger.info('↪  config   :: reload');
			config = await import(/* @vite-ignore */ pathToconfig)
				.then((module) => module.default)
				.then(async (rawConfig) => await buildConfig(rawConfig));
			flatConfig = flattenConfig(config);
		},

		getDefaultLocale() {
			return config.localization?.default || undefined;
		},

		getLocalesCodes() {
			return config.localization ? config.localization.locales.map((locale) => locale.code) : [];
		},
		getDocumentPrototype,
		getGlobal,
		getCollection,
		getBySlug
	};
}

export type ConfigInterface = AsyncReturnType<typeof createConfigInterface>;
