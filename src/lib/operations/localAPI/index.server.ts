import { RizomError, RizomFormError } from '../../errors/index.js';
import { CollectionInterface } from './Collection.js';
import { GlobalInterface } from './Global.js';
import type { Rizom } from '../../rizom.server.js';
import type {
	LocalAPI as LocalAPIType,
	LocalAPIConstructorArgs,
	LocalAPICollectionInterface,
	LocalAPIGlobalInterface
} from 'rizom/types/api.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterCollection } from 'rizom';
import type { RegisterGlobal } from 'rizom';
import type { FormErrors } from 'rizom/types/panel.js';
import validate from 'rizom/utils/validate.js';

export class LocalAPI implements LocalAPIType {
	//
	#requestEvent: RequestEvent;
	rizom: Rizom;

	constructor({ rizom, event }: LocalAPIConstructorArgs) {
		this.rizom = rizom;
		this.#requestEvent = event;
	}

	enforceLocale(locale: string) {
		this.#requestEvent.locals.locale = locale;
	}

	collection<Slug extends keyof RegisterCollection>(
		slug: Slug
	): LocalAPICollectionInterface<RegisterCollection[Slug]> {
		const collectionConfig = this.rizom.config.getCollection(slug);
		if (!collectionConfig) {
			throw new RizomError(`${slug} is not a collection`);
		}

		return new CollectionInterface<RegisterCollection[Slug]>({
			event: this.#requestEvent,
			config: collectionConfig,
			adapter: this.rizom.adapter,
			api: this as LocalAPIType,
			defaultLocale: this.rizom.config.getDefaultLocale()
		});
	}

	global<Slug extends keyof RegisterGlobal>(
		slug: Slug
	): LocalAPIGlobalInterface<RegisterGlobal[Slug]> {
		const globalConfig = this.rizom.config.getGlobal(slug);
		if (!globalConfig) {
			throw new RizomError(`${slug} is not a global`);
		}
		return new GlobalInterface({
			event: this.#requestEvent,
			config: globalConfig,
			adapter: this.rizom.adapter,
			api: this as LocalAPIType,
			defaultLocale: this.rizom.config.getDefaultLocale()
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

		const emailValidation = validate.email(email);
		if (typeof emailValidation === 'string') {
			errors.email = RizomFormError.INVALID_FIELD;
		}

		if (typeof name !== 'string') {
			errors.name = RizomFormError.INVALID_FIELD;
		}

		const passwordValidation = validate.password(password);
		if (typeof passwordValidation === 'string') {
			errors.name = RizomFormError.INVALID_FIELD;
		}

		if (Object.keys(errors).length > 0) {
			throw new RizomFormError(errors);
		}

		await this.rizom.auth.createFirstUser({ email, name, password });
	}
}

type CreateFirstPanelUserArgs = { email: string; name: string; password: string };
