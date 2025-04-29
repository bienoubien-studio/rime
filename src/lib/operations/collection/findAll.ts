import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from '$lib/types/config.js';
import type { CollectionSlug, GenericDoc, RawDoc } from '$lib/types/doc.js';
import type { RegisterCollection } from 'rizom';
import { RizomError } from '$lib/errors/index.js';
import type { Adapter } from '$lib/sqlite/index.server.js';
import { transformDocument } from '../tasks/transformDocument.server.js';
import type { LocalAPI } from '../localAPI/index.server.js';

type Args = {
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
};

export const findAll = async <T extends GenericDoc>(args: Args): Promise<T[]> => {
	const { config, event, locale, adapter, sort, limit, offset, api, depth } = args;

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentsRaw = await adapter.collection.findAll({
		slug: config.slug,
		sort,
		limit,
		offset,
		locale
	});

	const processDocument = async (documentRaw: RawDoc) => {
		//
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
	
	const documents = await Promise.all(documentsRaw.map((raw) => processDocument(raw)));
	
	return documents;
};
