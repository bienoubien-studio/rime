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
import type { CompiledCollectionConfig } from 'rizom/types/config.js';
import type { AnyFormField } from 'rizom/types/fields.js';
import type { OperationQuery, LocalAPICollectionInterface, LocalAPI } from 'rizom/types/api';
import type { Adapter } from 'rizom/types/adapter';
import { toHash } from 'rizom/utils/string.js';
import { RizomError } from 'rizom/errors/index.js';

type Args = {
	config: CompiledCollectionConfig;
	adapter: Adapter;
	defaultLocale: string | undefined;
	api: LocalAPI;
	event: RequestEvent;
};

class CollectionInterface<Doc extends GenericDoc = GenericDoc>
	implements LocalAPICollectionInterface<Doc>
{
	#event: RequestEvent;
	#adapter: Adapter;
	#api: LocalAPI;
	defaultLocale: string | undefined;
	config: CompiledCollectionConfig;

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

		if (this.#event.locals.cache) {
			const key = toHash(
				`find-${this.config.slug}-${sort}-${depth}-${limit || 'nolimit'}-${locale || ''}-${query.toString()}`
			);
			return this.#event.locals.cache.get(key, () => find<Doc>(params));
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

		if (this.#event.locals.cache) {
			const key = toHash(
				`findall-${this.config.slug}-${sort}-${depth}-${limit || 'nolimit'}-${locale || ''}`
			);
			return this.#event.locals.cache.get(key, () => findAll<Doc>(params));
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

		if (this.#event.locals.cache) {
			console.log('cache ?!');
			const key = toHash(`findall-${this.config.slug}-${id}-${depth}-${locale || ''}`);
			return this.#event.locals.cache.get(key, () => findById<Doc>(params));
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
