// import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { dev } from '$app/environment';
import type { Config } from '$lib/core/config/types.js';
import devCache from '$lib/core/dev/cache/index.js';
import type { RegisterArea, RegisterCollection } from '$lib/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { AreaInterface } from './areas/local-api.server.js';
import { CollectionInterface } from './collections/local-api.server.js';
import { getBaseAuthConfig } from './config/auth/better-auth.server.js';
import { createConfigInterface } from './config/config-interface.server.js';
import type { BuildConfig } from './config/server/index.server.js';
import validate from './config/server/validate.js';
import writeMemo from './config/server/write.js';
import generateRoutes from './dev/generate/routes/index.js';
import generateTypes from './dev/generate/types/index.js';
import { RimeError } from './errors/index.js';
import { logger } from './logger/index.server.js';
// import type { CorePlugins } from './plugins/plugins.js';

export type Rime<C extends Config = Config> = Awaited<ReturnType<typeof createRime<C>>>;
export type RimeContext<C extends Config = Config> = ReturnType<Rime<C>['createRimeContext']>;
export type IConfig<C extends Config = Config> = ReturnType<typeof createConfigInterface<C>>;

/**
 * Creates a configuration interface that provides access to the compiled Rime configuration
 */
export async function createRime<const C extends Config>(config: BuildConfig<C>) {
	// Normalize plugins to a simple name->actions map
	const serverPlugins = config.$plugins;
	const plugins = Object.fromEntries(
		serverPlugins.map((plugin) => [plugin.name, plugin.actions ?? {}])
	) as typeof config.$InferPluginsServer;

	// const getCache = () => plugins.cache;
	// const getSse = () => plugins.sse;
	// const getMailer = () => plugins.mailer;

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
	const baseAuthconfig = getBaseAuthConfig({ mailer: plugins.mailer, config });

	type BetterAuthPlugins = typeof config.$InferAuthPlugins;
	const betterAuthPlugins = Array.isArray(config.$auth?.plugins)
		? [...baseAuthconfig.plugins, ...(config.$auth.plugins as BetterAuthPlugins)]
		: baseAuthconfig.plugins;

	const auth = betterAuth({
		...baseAuthconfig,
		plugins: betterAuthPlugins,
		database: adapter.auth.betterAuthAdapter
	});

	/**
	 * Function that define the locale to use in a request event
	 * based on this priority, high to low :
	 * - locale inside the url ex: /en/foo
	 * - locale from searchParams ex: ?locale=en
	 * - locale from cookie
	 * - default locale
	 */
	function defineLocale(event: RequestEvent) {
		// locale present inside the url params ex : /en/foo
		const params = event.params;
		const paramLocale =
			'locale' in params && typeof params.locale === 'string' ? params.locale : null;

		// locale present as a search param ex : ?locale=en
		const searchParams = event.url.searchParams;
		const hasParams = searchParams.toString();
		const searchParamLocale = hasParams && searchParams.get('locale');

		// locale from the cookie
		const cookieLocale = event.cookies.get('Locale');
		const defaultLocale = iConfig.getDefaultLocale();
		const locale = paramLocale || searchParamLocale || cookieLocale;

		if (locale && iConfig.getLocalesCodes().includes(locale)) {
			return (event.locals.locale = locale);
		}
		return (event.locals.locale = defaultLocale);
	}

	return {
		defineLocale,

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
			defineLocale(event);
			return {
				...plugins,
				// get cache() {
				// 	return getCache();
				// },

				// get sse() {
				// 	return getSse();
				// },

				// get mailer() {
				// 	return getMailer();
				// },

				get auth() {
					return auth;
				},

				get adapter() {
					return adapter;
				},

				get plugins() {
					return serverPlugins;
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
	} as const;
}
