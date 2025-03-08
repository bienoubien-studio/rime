import type { RequestEvent } from '@sveltejs/kit';
import type {
	Adapter,
	CollectionSlug,
	CompiledCollection,
	GenericDoc,
	OperationQuery
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { RizomError } from 'rizom/errors';
import { transformDocument } from '../tasks/transformDocument.server';
import type { RawDoc } from 'rizom/types/doc';
import type { LocalAPI } from '../localAPI/index.server';

type FindArgs = {
	query: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T[]> => {
	//
	const { config, event, locale, adapter, sort, limit, api, depth, query } = args;

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentsRaw = await adapter.collection.query({
		slug: config.slug,
		query,
		sort,
		limit,
		locale
	});

	const processDocument = async (documentRaw: RawDoc) => {
		let document = await transformDocument<T>({
			raw: documentRaw,
			config,
			api,
			adapter,
			locale,
			depth,
			event
		});

		for (const hook of config.hooks?.beforeRead || []) {
			const result = await hook({
				doc: document as RegisterCollection[CollectionSlug],
				config,
				operation: 'read',
				api,
				rizom: event.locals.rizom,
				event
			});
			document = result.doc as T;
		}

		return document;
	};

	const documents = await Promise.all(documentsRaw.map((doc) => processDocument(doc)));

	return documents;
};
