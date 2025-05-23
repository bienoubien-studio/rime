import { RizomError, RizomFormError } from '../errors/index.js';
import { CollectionInterface } from '../collections/local-api.server.js';
import { AreaInterface } from '../areas/local-api.server.js';
import { email as validateEmail, password as validatePassword } from '$lib/util/validate.js';
import type { Rizom } from '../main.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { RegisterArea, RegisterCollection } from '$lib/index.js';
import type { FormErrors } from '$lib/panel/types.js';
import type { CompiledCollection } from '$lib/types.js';

export type LocalAPIConstructorArgs = {
	rizom: Rizom;
	event: RequestEvent;
};

export class LocalAPI {
	//
	#operationsCount = 0;
	#requestEvent: RequestEvent;
	rizom: Rizom;

	constructor({ rizom, event }: LocalAPIConstructorArgs) {
		this.rizom = rizom;
		this.#requestEvent = event;
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
		const collectionConfig = this.rizom.config.getCollection(slug);

		return new CollectionInterface<RegisterCollection[Slug]>({
			event: this.#requestEvent,
			config: collectionConfig as CompiledCollection, // casting fix TS error when no app.generated.d.ts
			adapter: this.rizom.adapter,
			api: this,
			defaultLocale: this.rizom.config.getDefaultLocale()
		});
	}

	area<Slug extends keyof RegisterArea>(slug: Slug) {
		const areaConfig = this.rizom.config.getArea(slug);

		return new AreaInterface<RegisterArea[Slug]>({
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
