import { RizomError, RizomFormError } from './errors/index.js';
import { CollectionInterface } from './collections/local-api.server.js';
import { AreaInterface } from './areas/local-api.server.js';
import { email as validateEmail, password as validatePassword } from '$lib/util/validate.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterArea, RegisterCollection, RegisterPlugins } from '$lib/index.js';
import type { FormErrors } from '$lib/panel/types.js';
import type { Adapter, CompiledCollection } from '$lib/types.js';
import type { ConfigInterface } from './config/index.server.js';
import type { CorePlugins, Plugins } from './types/plugins.js';

export type RizomConstructorArgs = {
	adapter: Adapter
	config: ConfigInterface
	event: RequestEvent;
};

export class Rizom {
	//
	#operationsCount = 0;
	#requestEvent: RequestEvent;
	#plugins: Plugins
	adapter: Adapter
	config: ConfigInterface
	
	constructor({ adapter, config, event }: RizomConstructorArgs) {
		this.adapter = adapter
		this.config = config
		this.defineLocale({ event })
		this.#requestEvent = event;
		this.#plugins = config.get('plugins')
	}
	
	preventOperationLoop() {
		this.#operationsCount++;
		if (this.#operationsCount++ > 1000) {
			throw new RizomError(RizomError.OPERATION_ERROR, 'infinite loop');
		}
	}
	
	enforceLocale(locale: string) {
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

	async createFirstPanelUser({ email, name, password }: CreateFirstPanelUserArgs) {
		const errors: FormErrors = {};

		if (!email) {
			errors.email = RizomFormError.REQUIRED_FIELD;
		}
		if (!name) {
			errors.name = RizomFormError.REQUIRED_FIELD;
		}
		if (!password) {
			errors.password = RizomFormError.REQUIRED_FIELD;
		}

		const emailValidation = validateEmail(email);
		if (typeof emailValidation === 'string') {
			errors.email = RizomFormError.INVALID_FIELD;
		}

		if (typeof name !== 'string') {
			errors.name = RizomFormError.INVALID_FIELD;
		}

		const passwordValidation = validatePassword(password);
		if (typeof passwordValidation === 'string') {
			errors.name = RizomFormError.INVALID_FIELD;
		}

		if (Object.keys(errors).length > 0) {
			throw new RizomFormError(errors);
		}

		await this.adapter.auth.createFirstUser({ email, name, password });
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
			return event.locals.locale = locale;
		}
		// event.cookies.set('Locale', defaultLocale, { path: '.' });
		return event.locals.locale = defaultLocale;
	}

	get plugins () {
		return this.#plugins as RegisterPlugins
	}
	
	get auth () {
		return this.adapter.auth
	}
	
	get cache () {
		return this.#plugins.cache as CorePlugins['cache']
	}
	
	get mailer () {
		return this.#plugins.mailer as CorePlugins['mailer']
	}

}

type CreateFirstPanelUserArgs = { email: string; name: string; password: string };
