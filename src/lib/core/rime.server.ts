// import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { dev } from '$app/environment';
import type { Config } from '$lib/core/config/types.js';
import devCache from '$lib/core/dev/cache/index.js';
import type { AreaSlug, CollectionSlug, PrototypeSlug } from '$lib/core/types/doc.js';
import type { RegisterArea, RegisterCollection, RegisterPlugins } from '$lib/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { AreaInterface } from './areas/local-api.server.js';
import { CollectionInterface } from './collections/local-api.server.js';
import { getBaseAuthConfig } from './config/auth/better-auth.server.js';
import type { BuildConfig } from './config/server/index.server.js';
import validate from './config/server/validate.js';
import writeMemo from './config/server/write.js';
import generateRoutes from './dev/generate/routes/index.js';
import generateTypes from './dev/generate/types/index.js';
import { RimeError } from './errors/index.js';
import { logger } from './logger/index.server.js';
import type { CorePlugins } from './types/plugins.js';

export type Rime<C extends Config = Config> = Awaited<ReturnType<typeof createRime<C>>>;
export type RimeContext<C extends Config = Config> = ReturnType<Rime<C>['createRimeContext']>;
export type IConfig<C extends Config = Config> = ReturnType<typeof createConfigInterface<C>>;

// const ensureMediasDirectory = <C extends { collections?: BuiltCollection[] }>(config: C) => {
// 		const hasUpload = (config.collections || []).some((collection) => !!collection.upload);
// 		if (hasUpload) {
// 			const mediasDirectory = path.resolve(process.cwd(), 'static/medias');
// 			if (!existsSync(mediasDirectory)) {
// 				mkdirSync(mediasDirectory, { recursive: true });
// 			}
// 		}
// 	};

/**
 * Creates a configuration interface that provides access to the compiled Rime configuration
 */
export async function createRime<const C extends Config>(config: BuildConfig<C>) {
	// Normalize plugins to a simple name->actions map
	const plugins = Object.fromEntries(
		(config.$plugins || []).map((plugin) => [plugin.name, plugin.actions || {}])
	) as RegisterPlugins;

	// 3) Root helpers
	// @ts-expect-error
	const getCache = () => plugins.cache as CorePlugins['cache'];
	// @ts-expect-error
	const getSse = () => plugins.sse as CorePlugins['sse'];
	// @ts-expect-error
	const getMailer = () => plugins.mailer as CorePlugins['mailer'];

	const iConfig = createConfigInterface(config);

	const { createAdapter, generateSchema } = config.$adapter;

	if (dev) {
		const changed = writeMemo(config);

		if (changed) {
			const valid = validate(config);
			if (!valid) {
				throw new RimeError('Config not valid');
			}
		}

		logger.info('Generating...');
		devCache.set('.generating', new Date().toISOString());
		generateRoutes(config);
		await generateSchema(config);
		await generateTypes(config);
		devCache.delete('.generating');
	}

	const adapter = await createAdapter(iConfig);
	const baseAuthconfig = getBaseAuthConfig({ mailer: getMailer(), config });

	type Plugins = typeof config.$InferAuthPlugins;
	const betterAuthPlugins = Array.isArray(config.$auth?.plugins)
		? [...baseAuthconfig.plugins, ...(config.$auth.plugins as Plugins)]
		: baseAuthconfig.plugins;

	const auth = betterAuth({
		...baseAuthconfig,
		plugins: betterAuthPlugins,
		database: adapter.auth.betterAuthAdapter
	});

	return {
		get cache() {
			return getCache();
		},

		get sse() {
			return getSse();
		},

		get mailer() {
			return getMailer();
		},

		get auth() {
			return auth;
		},

		get adapter() {
			return adapter;
		},

		get config() {
			return iConfig;
		},

		get plugins() {
			return plugins;
		},

		createRimeContext(event: RequestEvent) {
			return {
				get cache() {
					return getCache();
				},

				get sse() {
					return getSse();
				},

				get mailer() {
					return getMailer();
				},

				get auth() {
					return auth;
				},

				get adapter() {
					return adapter;
				},

				get plugins() {
					return plugins;
				},

				get config() {
					return iConfig;
				},

				/**
				 * This overrides the locale on the current event.
				 */
				setLocale(locale: string | undefined) {
					event.locals.locale = locale;
				},

				getLocale() {
					return event.locals.locale;
				},

				collection<Slug extends keyof RegisterCollection>(slug: Slug) {
					const collectionConfig = iConfig.getCollection(slug as unknown as string);
					return new CollectionInterface<RegisterCollection[Slug]>({
						event,
						config: collectionConfig,
						defaultLocale: iConfig.getDefaultLocale()
					});
				},

				area<Slug extends keyof RegisterArea>(slug: Slug) {
					const areaConfig = iConfig.getArea(slug as unknown as string);
					return new AreaInterface<RegisterArea[Slug]>({
						event,
						config: areaConfig,
						defaultLocale: iConfig.getDefaultLocale()
					});
				}
			};
		}
	};
}

function createConfigInterface<C extends Config>(config: BuildConfig<C>) {
	//
	const getLocalesCodes = () =>
		config.localization ? config.localization.locales.map((l) => l.code) : [];
	const isValidLocale = (locale: string) => getLocalesCodes().includes(locale);
	const getArea = (slug: string) => {
		const areaConfig = (config.areas || []).find((g) => g.slug === slug);
		if (!areaConfig) throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not an area`);
		return areaConfig;
	};
	const getCollection = (slug: string) => {
		const collectionConfig = (config.collections || []).find((c) => c.slug === slug);
		if (!collectionConfig)
			throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not a collection`);
		return collectionConfig;
	};
	const getBySlug = (slug: string) => {
		try {
			return getCollection(slug);
		} catch {
			try {
				return getArea(slug);
			} catch {
				throw new RimeError(RimeError.BAD_REQUEST, `${slug} is not a valid area or collection`);
			}
		}
	};

	const isCollection = (slug: string): slug is CollectionSlug =>
		!!(config.collections || []).find((c) => c.slug === slug);

	const isArea = (slug: string): slug is AreaSlug =>
		!!(config.areas || []).find((g) => g.slug === slug);

	return {
		get raw() {
			return config;
		},

		/**
		 * Gets all collections config
		 */
		get collections() {
			return config.collections;
		},

		/**
		 * Gets all areas config
		 */
		get areas() {
			return config.areas;
		},

		/**
		 * Gets the default locale from the configuration
		 */
		getDefaultLocale() {
			return config.localization?.default || undefined;
		},

		/**
		 * Gets all configured locale codes
		 */
		getLocalesCodes,

		/**
		 * Checks if a locale code is valid according to the configuration
		 */
		isValidLocale,

		/**
		 * Retrieves an area configuration by its slug
		 */
		getArea,

		/**
		 * Retrieves a collection configuration by its slug
		 */
		getCollection,

		/**
		 * Retrieves either an area or collection configuration by its slug
		 */
		getBySlug,

		/**
		 * Checks if a slug represents a collection
		 */
		isCollection,

		/**
		 * Checks if a slug represents an area
		 */
		isArea,

		/**
		 * Determines the prototype (collection or area) of a document by its slug
		 */
		getDocumentPrototype(slug: PrototypeSlug) {
			if (isCollection(slug)) return 'collection';
			if (isArea(slug)) return 'area';
			throw new RimeError(RimeError.BAD_REQUEST, slug + ' is neither a collection nor an area');
		}
	};
}
