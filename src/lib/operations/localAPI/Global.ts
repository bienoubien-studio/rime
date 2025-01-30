import { createBlankDocument } from '../../utils/doc.js';
import { find } from '../global/find.js';
import { update } from '../global/update.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { BuiltGlobalConfig, CompiledGlobalConfig } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { LocalAPIGlobalInterface, LocalAPI } from 'rizom/types/api.js';
import type { FormErrors } from 'rizom/types/panel.js';

type Args = {
	config: CompiledGlobalConfig;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event: RequestEvent | undefined;
};

class GlobalInterface<Doc extends GenericDoc = GenericDoc> implements LocalAPIGlobalInterface<Doc> {
	#event: RequestEvent | undefined;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: CompiledGlobalConfig;

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

	blank(): Doc {
		return createBlankDocument(this.config) as Doc;
	}

	find(args?: { locale?: string; depth?: number }): Promise<Doc> {
		return find<Doc>({
			locale: this.#fallbackLocale(args?.locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth: args?.depth
		});
	}

	update(args: { data: Partial<Doc>; locale?: string }): Promise<Doc | { errors: FormErrors }> {
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

export { GlobalInterface };
