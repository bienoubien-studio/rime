import { makeEmptyDoc } from '../../utils/doc.js';
import { find } from '../global/find.js';
import { update } from '../global/update.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { BuiltGlobalConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPIGlobalInterface, LocalAPI } from 'rizom/types/api.js';

type Args = {
	config: BuiltGlobalConfig;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event: RequestEvent | undefined;
};

class GlobalInterface implements LocalAPIGlobalInterface {
	#event: RequestEvent | undefined;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: BuiltGlobalConfig;

	constructor({ config, adapter, defaultLocale, event, api }: Args) {
		this.config = config;
		this.#adapter = adapter;
		this.#event = event;
		this.#api = api;
		this.defaultLocale = defaultLocale;
		this.find = this.find.bind(this);
		this.update = this.update.bind(this);
	}

	#fallbackLocale(locale?: string) {
		return locale || this.#event?.locals.locale || this.defaultLocale;
	}

	emptyDoc() {
		return makeEmptyDoc(this.config);
	}

	find<T extends GenericDoc = GenericDoc>(args?: FindArgs) {
		return find<T>({
			locale: this.#fallbackLocale(args?.locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth: args?.depth || 0
		});
	}

	update<T extends GenericDoc = GenericDoc>({ data, locale }: UpdateArgs<T>) {
		return update<T>({
			data,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}
}

export { GlobalInterface };

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type UpdateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string;
};

type FindArgs = { locale?: string; depth?: number };
