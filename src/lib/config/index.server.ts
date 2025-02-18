import path from 'path';
import { RizomError } from '../errors/index.js';
import { flattenWithGuard } from '../utils/object.js';
import { buildConfig } from './build/index.js';
import { existsSync, mkdirSync } from 'fs';
import type {
	CompiledCollectionConfig,
	CompiledAreaConfig,
	CompiledConfig
} from 'rizom/types/config.js';
import type { AsyncReturnType, Dic } from 'rizom/types/utility.js';
import type { CollectionSlug, Config, PrototypeSlug } from 'rizom/types/index.js';
import type { AreaSlug } from 'rizom/types/doc.js';
import { dev } from '$app/environment';

export async function createConfigInterface(rawConfig: Config) {
	const config: CompiledConfig = await buildConfig(rawConfig, { generateFiles: dev });

	const flattenConfig = (config: CompiledConfig) => {
		return flattenWithGuard(config, {
			shouldFlat: ([key]) =>
				!['cors', 'plugins', 'routes', 'locales', 'areas', 'collections'].includes(key)
		});
	};

	const flatConfig: Dic = flattenConfig(config);

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

	const getArea = (slug: string): CompiledAreaConfig | undefined => {
		return config.areas.find((g) => g.slug === slug);
	};

	const getCollection = (slug: string): CompiledCollectionConfig | undefined => {
		return config.collections.find((c) => c.slug === slug);
	};

	const getBySlug = (slug: string) => {
		return getArea(slug) || getCollection(slug);
	};

	const isCollection = (slug: string): slug is CollectionSlug => {
		return !!getCollection(slug);
	};

	const isArea = (slug: string): slug is AreaSlug => {
		return !!getArea(slug);
	};

	const getDocumentPrototype = (slug: PrototypeSlug) => {
		if (isCollection(slug)) {
			return 'collection';
		} else if (isArea(slug)) {
			return 'area';
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

		get areas() {
			return config.areas;
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
		getArea,
		getCollection,
		isCollection,
		isArea,
		getBySlug
	};
}

export type ConfigInterface = AsyncReturnType<typeof createConfigInterface>;
