import { RizomError } from '../../errors/error.server.js';
import { CollectionInterface } from './Collection.js';
import { GlobalInterface } from './Global.js';
import type { Rizom } from '../../rizom.server.js';
import type { GetRegisterType, PrototypeSlug } from 'rizom/types/doc.js';
import type { LocalAPI as LocalAPIType, LocalAPIConstructorArgs } from 'rizom/types/api.js';
import type { RequestEvent } from '@sveltejs/kit';

export class LocalAPI implements LocalAPIType {
	//
	#requestEvent: RequestEvent | undefined;
	#rizom: Rizom;
	hasGrantedPrivilege: boolean = false;

	constructor({ rizom, event }: LocalAPIConstructorArgs) {
		this.#rizom = rizom;
		this.#requestEvent = event;
	}

	enforceLocale(locale: string) {
		if (!this.#requestEvent) {
			throw new RizomError('Using local API outside of sveltekit handlers.');
		}
		this.#requestEvent.locals.locale = locale;
	}

	grantAdminPrivilege(): LocalAPIType {
		this.hasGrantedPrivilege = true;
		return this;
	}

	collection(slug: GetRegisterType<'PrototypeSlug'>) {
		const collectionConfig = this.#rizom.config.getCollection(slug);
		if (!collectionConfig) {
			throw new RizomError(`${slug} is not a collection`);
		}
		if (!this.#requestEvent) {
			throw new RizomError('Using local API outside of sveltekit handlers.');
		}
		return new CollectionInterface({
			event: this.#requestEvent,
			config: collectionConfig,
			adapter: this.#rizom.adapter,
			api: this as LocalAPIType,
			defaultLocale: this.#rizom.config.getDefaultLocale()
		});
	}

	global(slug: PrototypeSlug) {
		const globalConfig = this.#rizom.config.getGlobal(slug);
		if (!globalConfig) {
			throw new RizomError(`${slug} is not a global`);
		}
		if (!this.#requestEvent) {
			throw new RizomError(
				'Using local API outside of sveltekit handlers, you probably should call api.grantAdminPrivilege() before operations.'
			);
		}
		return new GlobalInterface({
			event: this.#requestEvent,
			config: globalConfig,
			adapter: this.#rizom.adapter,
			api: this as LocalAPIType,
			defaultLocale: this.#rizom.config.getDefaultLocale()
		});
	}
}
