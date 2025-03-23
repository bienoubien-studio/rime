import { RizomError, RizomFormError } from '../../errors/index.js';
import { CollectionInterface } from './Collection.js';
import { AreaInterface } from './Area.js';
import type { Rizom } from '../../rizom.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterArea, RegisterCollection } from 'rizom';
import type { FormErrors } from 'rizom/types/panel.js';
import { email as validateEmail, password as validatePassword } from 'rizom/util/validate.js';

export type LocalAPIConstructorArgs = {
	rizom: Rizom;
	event: RequestEvent;
};

export class LocalAPI {
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

	collection<Slug extends keyof RegisterCollection>(slug: Slug) {
		const collectionConfig = this.rizom.config.getCollection(slug);
		if (!collectionConfig) {
			throw new RizomError(`${slug} is not a collection`);
		}

		return new CollectionInterface<RegisterCollection[Slug]>({
			event: this.#requestEvent,
			config: collectionConfig,
			adapter: this.rizom.adapter,
			api: this,
			defaultLocale: this.rizom.config.getDefaultLocale()
		});
	}

	area<Slug extends keyof RegisterArea>(slug: Slug) {
		const areaConfig = this.rizom.config.getArea(slug);
		if (!areaConfig) {
			throw new RizomError(`${slug} is not a area`);
		}
		return new AreaInterface({
			event: this.#requestEvent,
			config: areaConfig,
			adapter: this.rizom.adapter,
			api: this,
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

		await this.rizom.auth.createFirstUser({ email, name, password });
	}
}

type CreateFirstPanelUserArgs = { email: string; name: string; password: string };
