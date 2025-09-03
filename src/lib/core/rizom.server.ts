import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { RegisterArea, RegisterCollection, RegisterPlugins } from '$lib/index.js';
import type { CompiledCollection } from '$lib/types.js';
import type { RequestEvent } from '@sveltejs/kit';
import { AreaInterface } from './areas/local-api.server.js';
import { CollectionInterface } from './collections/local-api.server.js';
import type { ConfigInterface } from './config/index.server.js';
import { RizomError } from './errors/index.js';
import type { CorePlugins, Plugins } from './types/plugins.js';

export type RizomConstructorArgs = {
	adapter: Adapter;
	config: ConfigInterface;
	event: RequestEvent;
};

export class Rizom {
	//
	#operationsCount = 0;
	#requestEvent: RequestEvent;
	#plugins: Plugins;
	adapter: Adapter;
	config: ConfigInterface;

	constructor({ adapter, config, event }: RizomConstructorArgs) {
		this.adapter = adapter;
		this.config = config;
		this.defineLocale({ event });
		this.#requestEvent = event;
		this.#plugins = config.get('plugins');
	}

	preventOperationLoop() {
		this.#operationsCount++;
		if (this.#operationsCount++ > 1000) {
			throw new RizomError(RizomError.OPERATION_ERROR, 'infinite loop');
		}
	}

	/**
	 * This overide the locale on the current event.
	 * Use it with caution.
	 * By default the locale is set by ```rizom.defineLocale```
	 */
	setLocale(locale: string) {
		this.#requestEvent.locals.locale = locale;
	}

	getLocale() {
		return this.#requestEvent.locals.locale;
	}

	collection<Slug extends keyof RegisterCollection>(slug: Slug) {
		const collectionConfig = this.config.getCollection(slug);

		return new CollectionInterface<RegisterCollection[Slug]>({
			event: this.#requestEvent,
			config: collectionConfig as CompiledCollection, // casting fix TS error when no app.generated.d.ts
			defaultLocale: this.config.getDefaultLocale()
		});
	}

	area<Slug extends keyof RegisterArea>(slug: Slug) {
		const areaConfig = this.config.getArea(slug);

		return new AreaInterface<RegisterArea[Slug]>({
			event: this.#requestEvent,
			config: areaConfig,
			defaultLocale: this.config.getDefaultLocale()
		});
	}

	/**
	 * define the locale to use in the event
	 * based on this hierarchy :
	 * - locale inside the url ex: /en/foo
	 * - locale from searchParams
	 * - locale from cookie
	 * - default locale
	 */
	defineLocale({ event }: { event: RequestEvent }) {
		// locale present inside the url params ex : /en/foo
		const params = event.params;
		const paramLocale = params.locale;

		// locale present as a search param ex : ?locale=en
		const searchParams = event.url.searchParams;
		const hasParams = searchParams.toString();
		const searchParamLocale = hasParams && searchParams.get('locale');

		// locale from the cookie
		const cookieLocale = event.cookies.get('Locale');
		const defaultLocale = this.config.getDefaultLocale();
		const locale = paramLocale || searchParamLocale || cookieLocale;

		if (locale && this.config.getLocalesCodes().includes(locale)) {
			// event.cookies.set('Locale', locale, { path: '.' });
			return (event.locals.locale = locale);
		}
		// event.cookies.set('Locale', defaultLocale, { path: '.' });
		return (event.locals.locale = defaultLocale);
	}

	get plugins() {
		return this.#plugins as RegisterPlugins;
	}

	get auth() {
		return this.adapter.auth;
	}

	get cache() {
		return this.#plugins.cache as CorePlugins['cache'];
	}

	get sse() {
		return this.#plugins.sse as CorePlugins['sse'];
	}

	get mailer() {
		return this.#plugins.mailer as CorePlugins['mailer'];
	}
}
