import type { RequestEvent } from '@sveltejs/kit';
import { createBlankDocument } from '../../util/doc.js';
import { find } from '../area/find.js';
import { update } from '../area/update.js';
import type { CompiledArea } from '$lib/types/config.js';
import type { GenericDoc } from '$lib/types/doc.js';
import type { Adapter } from '$lib/types/adapter.js';
import type { LocalAPI } from './index.server.js';
import type { DeepPartial } from '$lib/types/util.js';

type Args = {
	config: CompiledArea;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event: RequestEvent;
};

class AreaInterface<Doc extends GenericDoc = GenericDoc> {
	#event: RequestEvent;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: CompiledArea;

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
		return locale || this.#event.locals.locale || this.defaultLocale;
	}

	blank(): Doc {
		return createBlankDocument(this.config) as Doc;
	}
	
	find({ locale, depth = 0 }: FindArgs): Promise<Doc> {

		this.#api.preventOperationLoop()

		const params = {
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'find',
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				depth,
				locale
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	update(args: { data: DeepPartial<Doc>; locale?: string }): Promise<Doc> {

		this.#api.preventOperationLoop()

		return update<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}
}

export { AreaInterface };

type FindArgs = { locale?: string; depth?: number };
