import { privateFieldNames } from 'rizom/collection/auth/privateFields.server.js';
import { isAuthConfig } from '../../config/util.js';
import { createBlankDocument } from '../../util/doc.js';
import { isFormField } from '../../util/field.js';
import { create } from '../collection/create.js';
import { deleteById } from '../collection/deleteById.js';
import { find } from '../collection/find.js';
import { findAll } from '../collection/findAll.js';
import { findById } from '../collection/findById.js';
import { updateById } from '../collection/updateById.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { FormField } from 'rizom/types/fields.js';
import type { OperationQuery } from 'rizom/types/api';
import { RizomError } from 'rizom/errors/index.js';
import type { RegisterCollection } from 'rizom';
import type { Adapter } from 'rizom/db/index.server.js';
import type { LocalAPI } from './index.server.js';

type Args = {
	config: CompiledCollection;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event: RequestEvent;
};

class CollectionInterface<Doc extends RegisterCollection[CollectionSlug]> {
	#event: RequestEvent;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: CompiledCollection;

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
		return locale || this.#event.locals.locale || this.defaultLocale;
	}

	blank(): Doc {
		if (isAuthConfig(this.config)) {
			const withoutPrivateFields = this.config.fields
				.filter(isFormField)
				.filter((field: FormField) => !privateFieldNames.includes(field.name));
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
		const params = {
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'find',
				this.config.slug,
				sort,
				depth,
				limit,
				locale,
				query
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	findAll({ locale, sort = '-createdAt', depth = 0, limit }: FindAllArgs = {}) {
		const params = {
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'findAll',
				this.config.slug,
				sort,
				depth,
				limit,
				locale
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => findAll<Doc>(params));
		}

		return findAll<Doc>(params);
	}

	findById({ id, locale, depth = 0 }: FindByIdArgs) {
		if (!id) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		const params = {
			id,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			depth
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'findById',
				this.config.slug,
				id,
				depth,
				locale
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => findById<Doc>(params));
		}

		return findById<Doc>(params);
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
	id?: string;
	locale?: string;
	depth?: number;
};

type UpdateByIdArgs<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string;
};
