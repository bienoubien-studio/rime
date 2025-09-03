import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { OperationContext } from '$lib/core/operations/hooks/index.js';
import type { CollectionSlug, GenericDoc, RawDoc } from '$lib/core/types/doc.js';
import type { OperationQuery } from '$lib/core/types/index.js';
import type { RegisterCollection } from '$lib/index.js';
import type { RequestEvent } from '@sveltejs/kit';

type FindArgs = {
	query?: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
	select?: string[];
	draft?: boolean;
	isSystemOperation?: boolean;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T[]> => {
	//
	const { config, event, locale, sort, limit, offset, depth, query, draft, select = [], isSystemOperation } = args;
	const { rizom } = event.locals;

	let context: OperationContext<CollectionSlug> = {
		isSystemOperation,
		params: {
			query,
			sort,
			limit,
			offset,
			locale,
			select,
			draft,
			depth
		}
	};

	for (const hook of config.hooks?.beforeOperation || []) {
		const result = await hook({
			config,
			operation: 'read',
			event,
			context
		});
		context = result.context;
	}

	const documentsRaw = await rizom.adapter.collection.find({
		slug: config.slug,
		query,
		sort,
		limit,
		offset,
		locale,
		select,
		draft
	});

	const hasSelect = select && Array.isArray(select) && select.length;

	async function processDocument(documentRaw: RawDoc) {
		let document = await event.locals.rizom.adapter.transform.doc({
			doc: documentRaw,
			slug: config.slug,
			locale,
			event,
			depth,
			withBlank: !hasSelect
		});

		for (const hook of config.hooks?.beforeRead || []) {
			const result = await hook({
				doc: document as RegisterCollection[CollectionSlug],
				config,
				operation: 'read',
				event,
				context
			});
			context = result.context;
			document = result.doc;
		}

		return document;
	}

	const documents = await Promise.all(documentsRaw.map((doc) => processDocument(doc)));

	return documents as T[];
};
