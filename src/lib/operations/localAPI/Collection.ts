import { privateFieldNames } from 'rizom/collection/auth/privateFields.server.js';
import { isAuthConfig } from '../../config/utils.js';
import { makeEmptyDoc } from '../../utils/doc.js';
import { isFormField } from '../../utils/field.js';
import { create } from '../collection/create.js';
import { deleteById } from '../collection/deleteById.js';
import { find } from '../collection/find.js';
import { findAll } from '../collection/findAll.js';
import { findById } from '../collection/findById.js';
import { updateById } from '../collection/updateById.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { BuiltCollectionConfig } from 'rizom/types/config.js';
import type { AnyFormField } from 'rizom/types/fields.js';
import type { OperationQuery, LocalAPICollectionInterface, LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';

type Args = {
	config: BuiltCollectionConfig;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event?: RequestEvent;
};

class CollectionInterface implements LocalAPICollectionInterface {
	#event: RequestEvent | undefined;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: BuiltCollectionConfig;

	constructor({ config, adapter, defaultLocale, event, api }: Args) {
		this.config = config;
		this.#adapter = adapter;
		this.defaultLocale = defaultLocale;
		this.#event = event;
		this.#api = api;
		this.create = this.create.bind(this);
		this.find = this.find.bind(this);
		this.findAll = this.findAll.bind(this);
		this.findById = this.findById.bind(this);
	}

	#fallbackLocale(locale?: string) {
		return locale || this.#event?.locals.locale || this.defaultLocale;
	}

	emptyDoc<T extends GenericDoc = GenericDoc>(): T {
		if (isAuthConfig(this.config)) {
			const withoutPrivateFields = this.config.fields
				.filter(isFormField)
				.filter((field: AnyFormField) => !privateFieldNames.includes(field.name));
			return makeEmptyDoc({
				...this.config,
				fields: [...withoutPrivateFields]
			});
		}
		return makeEmptyDoc(this.config) as T;
	}

	get isAuth() {
		return !!this.config.auth;
	}

	create<T extends GenericDoc = GenericDoc>({ data, locale }: CreateArgs<T>) {
		return create<T>({
			data,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}

	find<T extends GenericDoc = GenericDoc>({
		query,
		locale,
		sort = '-createdAt',
		depth = 0,
		limit
	}: FindArgs) {
		return find<T>({
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit
		});
	}

	findAll<T extends GenericDoc = GenericDoc>({
		locale,
		sort = '-createdAt',
		depth = 0,
		limit
	}: FindAllArgs = {}) {
		return findAll<T>({
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit
		});
	}

	findById<T extends GenericDoc = GenericDoc>({ id, locale, depth = 0 }: FindByIdArgs) {
		return findById<T>({
			id,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth
		});
	}

	updateById<T extends GenericDoc = GenericDoc>({ id, data, locale }: UpdateByIdArgs<T>) {
		return updateById<T>({
			id,
			data,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}

	deleteById = ({ id }: DeleteByIdArgs) => {
		return deleteById({
			id,
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	};
}

export { CollectionInterface };

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type CreateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string;
};

type DeleteByIdArgs = { id: string };

type FindArgs = {
	query: OperationQuery;
	locale?: string;
	sort?: string;
	depth?: number;
	limit?: number;
};

type FindAllArgs = {
	locale?: string;
	sort?: string;
	depth?: number;
	limit?: number;
};

type FindByIdArgs = {
	id: string;
	locale?: string;
	depth?: number;
};

type UpdateByIdArgs<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string;
};
