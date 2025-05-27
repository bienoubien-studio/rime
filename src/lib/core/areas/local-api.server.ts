import type { RequestEvent } from '@sveltejs/kit';
import { createBlankDocument } from '../../util/doc.js';
import { find } from './operations/find.js';
import { update } from './operations/update.js';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { Adapter } from '$lib/adapter-sqlite/types.js';
import type { Rizom } from '../rizom.server.js';
import type { DeepPartial } from '$lib/util/types.js';

type Args = {
	config: CompiledArea;
	defaultLocale: string | undefined;
	event: RequestEvent;
};

class AreaInterface<Doc extends GenericDoc = GenericDoc> {
	#event: RequestEvent;
	#rizom: Rizom;
	defaultLocale: string | undefined;
	config: CompiledArea;

	constructor({ config, defaultLocale, event }: Args) {
		this.config = config;
		this.#event = event;
		this.#rizom = event.locals.rizom;
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

	find({ locale, select = [], depth = 0, versionId }: FindArgs): Promise<Doc> {

		this.#rizom.preventOperationLoop()

		const params = {
			locale: this.#fallbackLocale(locale),
			select,
			versionId,
			config: this.config,
			event: this.#event,
			rizom: this.#rizom,
			depth
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.toHashKey(
				'find',
				select.join(','),
				this.config.slug,
				versionId || 'latest',
				this.#event.locals.user?.roles.join(',') || 'no-user',
				depth,
				locale
			);
			return this.#event.locals.rizom.cache.get(key, () => find<Doc>(params));
		}
		
		return find<Doc>(params);
	}

	update(args: { data: DeepPartial<Doc>; locale?: string, versionId?:string }): Promise<Doc> {

		this.#rizom.preventOperationLoop()

		return update<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			versionId: args.versionId,
			config: this.config,
			event: this.#event
		});
	}
}

export { AreaInterface };

type FindArgs = {
	locale?: string;
	versionId?: string;
	depth?: number, 
	select?: string[]
};
