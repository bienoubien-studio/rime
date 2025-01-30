import { privateFieldNames } from 'rizom/collection/auth/privateFields.server.js';
import { isAuthConfig } from '../../config/utils.js';
import { createBlankDocument } from '../../utils/doc.js';
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

class CollectionInterface<Doc extends GenericDoc = GenericDoc>
	implements LocalAPICollectionInterface<Doc>
{
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

	blank(): Doc {
		if (isAuthConfig(this.config)) {
			const withoutPrivateFields = this.config.fields
				.filter(isFormField)
				.filter((field: AnyFormField) => !privateFieldNames.includes(field.name));
			return createBlankDocument({
				...this.config,
				fields: [...withoutPrivateFields]
			}) as Doc;
		}
		return createBlankDocument(this.config) as Doc;
	}

	get isAuth() {
		return !!this.config.auth;
	}

	create(args: { data: Partial<Doc>; locale?: string }) {
		return create<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}

	find({ query, locale, sort = '-createdAt', depth = 0, limit }: FindArgs) {
		return find<Doc>({
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

	findAll({ locale, sort = '-createdAt', depth = 0, limit }: FindAllArgs = {}) {
		return findAll<Doc>({
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

	findById({ id, locale, depth = 0 }: FindByIdArgs) {
		return findById<Doc>({
			id,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth
		});
	}

	updateById({ id, data, locale }: UpdateByIdArgs<Doc>) {
		return updateById<Doc>({
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
