import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { CollectionSlug, GenericDoc, RawDoc } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import { transformDocument } from '$lib/core/operations/shared/transformDocument.server.js';

type Args = {
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
};

export const findAll = async <T extends GenericDoc>(args: Args): Promise<T[]> => {
	const { config, event, locale, sort, limit, offset, depth } = args;
	const { rizom } = event.locals

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug );
	}
	
	const documentsRaw = await rizom.adapter.collection.findAll({
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
			locale,
			depth,
			event
		});

		for (const hook of config.hooks?.beforeRead || []) {
			const result = await hook({
				doc: document as RegisterCollection[CollectionSlug],
				config,
				operation: 'read',
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
