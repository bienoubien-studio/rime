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
import type { Rizom } from '../rizom.server.js';
import type { DeepPartial } from '$lib/util/types.js';

type Args = {
	config: CompiledCollection;
	defaultLocale: string | undefined;
	event: RequestEvent;
};

class CollectionInterface<Doc extends RegisterCollection[CollectionSlug]> {
	
	#event: RequestEvent;
	#rizom: Rizom;
	defaultLocale: string | undefined;
	config: CompiledCollection;

	constructor({ config, defaultLocale, event }: Args) {
		this.config = config;
		this.defaultLocale = defaultLocale;
		this.#event = event;
		this.#rizom = event.locals.rizom;
		this.create = this.create.bind(this);
		this.find = this.find.bind(this);
		this.findAll = this.findAll.bind(this);
		this.findById = this.findById.bind(this);
		this.select = this.select.bind(this);
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

	create(args: { data: DeepPartial<Doc>; locale?: string, draft?: boolean }) {
		return create<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			draft: args.draft,
			config: this.config,
			event: this.#event,
		});
	}

	find({ query, locale, sort = '-createdAt', depth = 0, limit, offset }: FindArgs): Promise<Doc[]> {
		
		this.#rizom.preventOperationLoop()
		
		const params = {
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			sort,
			depth,
			limit,
			offset
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.toHashKey(
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
			return this.#event.locals.rizom.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	select({ select: selectArray, query, locale, sort = '-createdAt', depth = 0, limit, offset }: SelectArgs): Promise<Doc[]> {
		
		this.#rizom.preventOperationLoop()

		const params = {
			select: selectArray,
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			sort,
			depth,
			limit,
			offset
		};
		
		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.toHashKey(
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
			return this.#event.locals.rizom.cache.get(key, () => select<Doc>(params));
		}

		return select<Doc>(params);
	}

	findAll({ locale, sort = '-createdAt', depth = 0, limit, offset }: FindAllArgs = {}): Promise<Doc[]> {
		
		this.#rizom.preventOperationLoop()

		const params = {
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			sort,
			depth,
			limit,
			offset,
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.toHashKey(
				'findAll',
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				sort,
				depth,
				limit,
				offset,
				locale
			);
			return this.#event.locals.rizom.cache.get(key, () => findAll<Doc>(params));
		}

		return findAll<Doc>(params);
	}

	findById({ id, versionId, locale, depth = 0 }: FindByIdArgs): Promise<Doc> {
		
		this.#rizom.preventOperationLoop()

		if (!id) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		const params = {
			id,
			versionId,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			depth
		};
		
		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.toHashKey(
				'findById',
				this.config.slug,
				this.#event.locals.user?.roles.join(',') || 'no-user',
				id,
				versionId || 'latest',
				depth,
				locale
			);
			return this.#event.locals.rizom.cache.get(key, () => findById<Doc>(params));
		}

		return findById<Doc>(params);
	}

	updateById({ id, versionId, data, locale, draft, isFallbackLocale = false }: UpdateByIdArgs<Doc>): Promise<Doc> {
		
		this.#rizom.preventOperationLoop()

		return updateById<Doc>({
			id,
			versionId,
			draft,
			data,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			isFallbackLocale
		});
	}

	deleteById = ({ id }: DeleteByIdArgs) => {
		
		this.#rizom.preventOperationLoop()

		return deleteById({
			id,
			config: this.config,
			event: this.#event,
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
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string;
	isFallbackLocale?: boolean;
};
