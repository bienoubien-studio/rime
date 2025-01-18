import path from 'path';
import { RizomError } from '../errors/error.server.js';
import { flattenWithGuard } from '../utils/object.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { buildConfig } from './build/index.js';
import { existsSync, mkdirSync } from 'fs';
import type {
	CompiledCollectionConfig,
	CompiledGlobalConfig,
	CompiledConfig
} from 'rizom/types/config.js';
import type { AsyncReturnType, Dic } from 'rizom/types/utility.js';
import type { CollectionSlug, PrototypeSlug } from 'rizom/types/index.js';
import type { GlobalSlug } from 'rizom/types/doc.js';
import { dev } from '$app/environment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createConfigInterface() {
	const fullPathToConfig = path.resolve(process.cwd(), './src/config/rizom.config');
	const pathToconfig = path.relative(__dirname, fullPathToConfig);

	let config: CompiledConfig;
	try {
		config = await import(/* @vite-ignore */ pathToconfig)
			.then((module) => module.default)
			.then(async (rawConfig) => await buildConfig(rawConfig, { generate: dev }));
	} catch (err) {
		console.log(err);
		throw new Error("can't import config from " + pathToconfig);
	}

	const flattenConfig = (config: CompiledConfig) => {
		return flattenWithGuard(config, {
			shouldFlat: ([key]) =>
				!['cors', 'plugins', 'routes', 'locales', 'globals', 'collections'].includes(key)
		});
	};

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

	const getGlobal = (slug: string): CompiledGlobalConfig | undefined => {
		return config.globals.find((g) => g.slug === slug);
	};

	const getCollection = (slug: string): CompiledCollectionConfig | undefined => {
		return config.collections.find((c) => c.slug === slug);
	};

	const getBySlug = (slug: string) => {
		return getGlobal(slug) || getCollection(slug);
	};

	const isCollection = (slug: string): slug is CollectionSlug => {
		return !!getCollection(slug);
	};

	const isGlobal = (slug: string): slug is GlobalSlug => {
		return !!getGlobal(slug);
	};

	const getDocumentPrototype = (slug: PrototypeSlug) => {
		if (isCollection(slug)) {
			return 'collection';
		} else if (isGlobal(slug)) {
			return 'global';
		}
		throw new RizomError(slug + 'is neither a collection nor a globlal');
	};

	return {
		//
		get raw() {
			if (!config) {
				throw new RizomError('config not loaded yet');
			}
			return config;
		},

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
			config = await import(/* @vite-ignore */ pathToconfig)
				.then((module) => module.default)
				.then(async (rawConfig) => await buildConfig(rawConfig, { generate: dev }));

			flatConfig = flattenConfig(config);
		},

		getDefaultLocale() {
			return config.localization?.default || undefined;
		},

		getLocalesCodes() {
			return config.localization ? config.localization.locales.map((locale) => locale.code) : [];
		},

		isValidLocale(locale: any) {
			const locales = config.localization
				? config.localization.locales.map((locale) => locale.code)
				: [];
			return locales.includes(locale);
		},

		getDocumentPrototype,
		getGlobal,
		getCollection,
		isCollection,
		isGlobal,
		getBySlug
	};
}

export type ConfigInterface = AsyncReturnType<typeof createConfigInterface>;
