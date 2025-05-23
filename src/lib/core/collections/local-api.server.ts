import { privateFieldNames } from './auth/config/privateFields.server.js';
import { isAuthConfig } from '../../util/config.js';
import { createBlankDocument } from '../../util/doc.js';
import { isFormField } from '../../util/field.js';
import { create } from './operations/create.js';
import { deleteById } from './operations/deleteById.js';
import { select } from './operations/select.js';
import { find } from './operations/find.js';
import { findAll } from './operations/findAll.js';
import { findById } from './operations/findById.js';
import { updateById } from './operations/updateById.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { CollectionSlug, GenericDoc } from '../types/doc.js';
import type { CompiledCollection } from '../config/types/index.js';
import type { FormField } from '$lib/fields/types.js';
import type { OperationQuery } from '$lib/core/types/index.js';
import type { RegisterCollection } from '$lib/index.js';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { LocalAPI } from '../operations/local-api.server.js';
import type { DeepPartial } from '$lib/util/types.js';

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

	create(args: { data: DeepPartial<Doc>; locale?: string }) {
		return create<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter
		});
	}

	find({ query, locale, sort = '-createdAt', depth = 0, limit, offset }: FindArgs): Promise<Doc[]> {
		
		this.#api.preventOperationLoop()

		const params = {
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit,
			offset
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'find',
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				sort,
				depth,
				limit,
				offset,
				locale,
				query
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	select({ select: selectArray, query, locale, sort = '-createdAt', depth = 0, limit, offset }: SelectArgs): Promise<Doc[]> {
		
		this.#api.preventOperationLoop()

		const params = {
			select: selectArray,
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit,
			offset
		};
		
		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'select',
				selectArray.join(','),
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				sort,
				depth,
				limit,
				offset,
				locale,
				query
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => select<Doc>(params));
		}

		return select<Doc>(params);
	}

	findAll({ locale, sort = '-createdAt', depth = 0, limit, offset }: FindAllArgs = {}): Promise<Doc[]> {
		
		this.#api.preventOperationLoop()

		const params = {
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			adapter: this.#adapter,
			api: this.#api,
			sort,
			depth,
			limit,
			offset,
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.plugins.cache.toHashKey(
				'findAll',
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				sort,
				depth,
				limit,
				offset,
				locale
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => findAll<Doc>(params));
		}

		return findAll<Doc>(params);
	}

	findById({ id, versionId, locale, depth = 0 }: FindByIdArgs): Promise<Doc> {
		
		this.#api.preventOperationLoop()

		if (!id) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		const params = {
			id,
			versionId,
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
				this.#event.locals.user?.roles.join(',') || 'no-user',
				id,
				versionId || 'latest',
				depth,
				locale
			);
			return this.#event.locals.rizom.plugins.cache.get(key, () => findById<Doc>(params));
		}

		return findById<Doc>(params);
	}

	updateById({ id, data, locale, isFallbackLocale = false }: UpdateByIdArgs<Doc>): Promise<Doc> {
		
		this.#api.preventOperationLoop()

		return updateById<Doc>({
			id,
			data,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			api: this.#api,
			adapter: this.#adapter,
			isFallbackLocale
		});
	}

	deleteById = ({ id }: DeleteByIdArgs) => {
		
		this.#api.preventOperationLoop()

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
	offset?: number;
};

type SelectArgs = {
	select: string[];
	query?: OperationQuery;
	locale?: string;
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
};

type FindAllArgs = {
	locale?: string;
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
};

type FindByIdArgs = {
	id?: string;
	versionId?: string;
	locale?: string;
	depth?: number;
};

type UpdateByIdArgs<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: DeepPartial<T>;
	locale?: string;
	isFallbackLocale?: boolean;
};
