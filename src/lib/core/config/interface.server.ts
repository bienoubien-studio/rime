import type { BuiltConfig, CompiledArea, CompiledCollection, CompiledConfig } from '$lib/core/config/types.js';
import type { AreaSlug, CollectionSlug, PrototypeSlug } from '$lib/core/types/doc.js';
import type { AsyncReturnType, Dic } from '$lib/util/types.js';
import { flattenWithGuard } from '../../util/object.js';
import { RimeError } from '../errors/index.js';
import { compileConfig } from './shared/compile.js';

/**
 * Creates a configuration interface that provides access to the compiled Rime configuration
 * @param rawConfig The raw configuration object defined by the user
 * @returns A configuration interface with methods to access different parts of the configuration
 * @example
 * const config = await createConfigInterface(rawConfig);
 * const pagesCollection = config.getCollection('pages');
 */
export async function createConfigInterface(rawConfig: BuiltConfig) {
	// const config: CompiledConfig = await buildConfig(rawConfig, { generateFiles: dev });
	const config: CompiledConfig = compileConfig(rawConfig);

	const plugins = Object.fromEntries(rawConfig.$plugins!.map((plugin) => [plugin.name, plugin.actions || {}]));

	/**
	 * Flattens the configuration object for easier access to nested properties
	 * @param config The compiled configuration object
	 * @returns A flattened dictionary of configuration values
	 */
	const flattenConfig = (config: CompiledConfig) => {
		return flattenWithGuard(config, {
			shouldFlat: ([key]) => !['cors', '$plugins', '$routes', 'locales', 'areas', 'collections'].includes(key)
		});
	};

	const flatConfig: Dic = flattenConfig(config);

	/**
	 * Retrieves an area configuration by its slug
	 * @param slug The slug of the area to retrieve
	 * @returns The compiled area configuration
	 * @throws {RimeError} If the area does not exist
	 */
	const getArea = (slug: string): CompiledArea => {
		const areaConfig = config.areas.find((g) => g.slug === slug);
		if (!areaConfig) throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not an area`);

		return areaConfig;
	};

	/**
	 * Retrieves a collection configuration by its slug
	 * @param slug The slug of the collection to retrieve
	 * @returns The compiled collection configuration
	 * @throws {RimeError} If the collection does not exist
	 */
	const getCollection = (slug: string): CompiledCollection => {
		const collectionConfig = config.collections.find((c) => c.slug === slug);
		if (!collectionConfig) throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not a collection`);

		return collectionConfig;
	};

	/**
	 * Retrieves either an area or collection configuration by its slug
	 * @param slug The slug to search for in both areas and collections
	 * @returns The compiled area or collection configuration
	 * @throws {RimeError} If the slug does not match any area or collection
	 */
	const getBySlug = (slug: string) => {
		// Try to find in collections
		try {
			const config = getCollection(slug);
			return config;
		} catch {
			try {
				const config = getArea(slug);
				return config;
			} catch {
				throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not a valid area or collection`);
			}
		}
	};

	/**
	 * Checks if a slug represents a collection
	 * @param slug The slug to check
	 * @returns True if the slug represents a collection, false otherwise
	 */
	const isCollection = (slug: string): slug is CollectionSlug => {
		return !!config.collections.find((c) => c.slug === slug);
	};

	/**
	 * Checks if a slug represents an area
	 * @param slug The slug to check
	 * @returns True if the slug represents an area, false otherwise
	 */
	const isArea = (slug: string): slug is AreaSlug => {
		return !!config.areas.find((g) => g.slug === slug);
	};

	/**
	 * Determines the prototype (collection or area) of a document by its slug
	 * @param slug The slug to check
	 * @returns 'collection' or 'area' depending on the document type
	 * @throws {RimeError} If the slug does not match any area or collection
	 */
	const getDocumentPrototype = (slug: PrototypeSlug) => {
		if (isCollection(slug)) {
			return 'collection';
		} else if (isArea(slug)) {
			return 'area';
		}
		throw new RimeError(RimeError.BAD_REQUEST, slug + 'is neither a collection nor a globlal');
	};

	return {
		/**
		 * Gets the raw compiled configuration object
		 * @throws {RimeError} If the configuration is not loaded
		 */
		get raw() {
			if (!config) {
				throw new RimeError('config not loaded yet');
			}
			return config;
		},

		/**
		 * Gets a configuration value by its path
		 * @param path Optional path to a specific configuration value
		 * @returns The configuration value at the specified path, or the entire configuration if no path is provided
		 * @throws {RimeError} If the configuration is not loaded
		 */
		get(path?: string) {
			if (!config) {
				throw new RimeError('config not loaded yet');
			}
			if (!path) return config;

			return path in flatConfig ? flatConfig[path] : null;
		},

		/**
		 * Gets all collection configurations
		 * @returns Array of compiled collection configurations
		 */
		get collections() {
			return config.collections;
		},

		/**
		 * Gets all area configurations
		 * @returns Array of compiled area configurations
		 */
		get areas() {
			return config.areas;
		},

		/**
		 * Gets the default locale from the configuration
		 * @returns The default locale code or undefined if no localization is configured
		 */
		getDefaultLocale() {
			return config.localization?.default || undefined;
		},

		/**
		 * Gets all configured locale codes
		 * @returns Array of locale codes or an empty array if no localization is configured
		 */
		getLocalesCodes() {
			return config.localization ? config.localization.locales.map((locale) => locale.code) : [];
		},

		/**
		 * Checks if a locale code is valid according to the configuration
		 * @param locale The locale code to check
		 * @returns True if the locale is valid, false otherwise
		 */
		isValidLocale(locale: any) {
			const locales = config.localization ? config.localization.locales.map((locale) => locale.code) : [];
			return locales.includes(locale);
		},

		get plugins() {
			return plugins;
		},

		getDocumentPrototype,
		getArea,
		getCollection,
		isCollection,
		isArea,
		getBySlug
	};
}

/**
 * Type representing the configuration interface returned by createConfigInterface
 */
export type ConfigInterface = AsyncReturnType<typeof createConfigInterface>;
