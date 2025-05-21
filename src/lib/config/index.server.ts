import path from 'path';
import { RizomError } from '../errors/index.js';
import { flattenWithGuard } from '../util/object.js';
import { buildConfig } from './build/index.js';
import { existsSync, mkdirSync } from 'fs';
import type { CompiledConfig } from '$lib/types/config.js';
import type { AsyncReturnType, Dic } from '$lib/types/util.js';
import type { CollectionSlug, Config, Field, FormField, PrototypeSlug } from '$lib/types/index.js';
import type { AreaSlug } from '$lib/types/doc.js';

const dev = process.env.NODE_ENV === 'development';

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

	const getArea = (slug: string) => {
		const areaConfig = config.areas.find((g) => g.slug === slug);
		if (!areaConfig) throw new RizomError(RizomError.BAD_REQUEST, `${slug} is not an area`)
		return areaConfig
	};
	
	const getCollection = (slug: string) => {
		const collectionConfig = config.collections.find((c) => c.slug === slug);
		if (!collectionConfig) throw new RizomError(RizomError.BAD_REQUEST, `${slug} is not a collection`)
		return collectionConfig
	};

	const getBySlug = (slug: string) => {
		console.log('get config ' + slug)
		// Try to find in collections
		const collectionConfig = config.collections.find((c) => c.slug === slug);
		if (collectionConfig) return collectionConfig;
		
		// Try to find in areas
		const areaConfig = config.areas.find((g) => g.slug === slug);
		if (areaConfig) return areaConfig;
		
		// Not found in either
		throw new RizomError(RizomError.BAD_REQUEST, `${slug} is not a valid area or collection`);
	};

	const isCollection = (slug: string): slug is CollectionSlug => {
		return !!config.collections.find((c) => c.slug === slug);
	};

	const isArea = (slug: string): slug is AreaSlug => {
		return !!config.areas.find((g) => g.slug === slug);
	};

	const getDocumentPrototype = (slug: PrototypeSlug) => {
		if (isCollection(slug)) {
			return 'collection';
		} else if (isArea(slug)) {
			return 'area';
		}
		throw new RizomError(RizomError.BAD_REQUEST, slug + 'is neither a collection nor a globlal');
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
