import { privateFieldNames } from './auth/config/privateFields.server.js';
import { isAuthConfig } from '../../util/config.js';
import { createBlankDocument } from '../../util/doc.js';
import { isFormField } from '../../util/field.js';
import { create } from './operations/create.js';
import { deleteById } from './operations/deleteById.js';
import { find } from './operations/find.js';
import { findById } from './operations/findById.js';
import { deleteDocs } from './operations/delete.js';
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
		this.findById = this.findById.bind(this);
		this.updateById = this.updateById.bind(this);
		this.deleteById = this.deleteById.bind(this);
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

	create(args: CreateArgs<Doc>) {
		return create<Doc>({
			data: args.data,
			locale: this.#fallbackLocale(args.locale),
			config: this.config,
			event: this.#event
		});
	}

	find({
		select: selectArray,
		query,
		locale,
		sort = '-updatedAt',
		depth = 0,
		limit,
		offset,
		draft
	}: FindArgs): Promise<Doc[]> {
		this.#rizom.preventOperationLoop();

		const params = {
			select: selectArray,
			query,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			sort,
			depth,
			limit,
			draft,
			offset
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.createKey('collection.find', {
				slug: this.config.slug,
				select: selectArray,
				userRoles: this.#event.locals.user?.roles,
				sort,
				depth,
				limit,
				offset,
				locale,
				draft,
				query
			});
			return this.#event.locals.rizom.cache.get(key, () => find<Doc>(params));
		}

		return find<Doc>(params);
	}

	findById({ id, versionId, locale, draft, depth = 0 }: FindByIdArgs): Promise<Doc> {
		this.#rizom.preventOperationLoop();

		if (!id) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		const params = {
			id,
			versionId,
			locale: this.#fallbackLocale(locale),
			config: this.config,
			event: this.#event,
			draft,
			depth
		};

		if (this.#event.locals.cacheEnabled) {
			const key = this.#event.locals.rizom.cache.createKey('collection.findById', {
				slug: this.config.slug,
				userRoles: this.#event.locals.user?.roles,
				id,
				versionId,
				depth,
				draft,
				locale
			});
			return this.#event.locals.rizom.cache.get(key, () => findById<Doc>(params));
		}

		return findById<Doc>(params);
	}

	updateById(args: UpdateByIdArgs<Doc>): Promise<Doc> {
		this.#rizom.preventOperationLoop();
		return updateById<Doc>({
			...args,
			locale: this.#fallbackLocale(args.locale),
			config: this.config,
			event: this.#event
		});
	}

	deleteById = ({ id }: DeleteByIdArgs) => {
		this.#rizom.preventOperationLoop();
		return deleteById({
			id,
			config: this.config,
			event: this.#event
		});
	};
	
	delete = (args: DeleteArgs) => {
		this.#rizom.preventOperationLoop();
		return deleteDocs({
			config: this.config,
			event: this.#event,
			...args
		});
	};
}

export { CollectionInterface };

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type DeleteByIdArgs = { id: string };

type FindArgs = {
	select?: string[];
	query?: OperationQuery;
	locale?: string;
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
	draft?: boolean;
};

type DeleteArgs = {
	query?: OperationQuery;
	locale?: string;
	sort?: string;
	limit?: number;
	offset?: number;
};

type FindByIdArgs = {
	id?: string;
	versionId?: string;
	locale?: string;
	depth?: number;
	draft?: boolean;
};

type UpdateByIdArgs<T extends GenericDoc = GenericDoc> = {
	id: string;
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string;
	isFallbackLocale?: boolean;
};

type CreateArgs<T> = { data: DeepPartial<T>; locale?: string; draft?: boolean };
