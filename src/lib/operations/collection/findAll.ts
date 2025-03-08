import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { CollectionSlug, GenericDoc, RawDoc } from 'rizom/types/doc.js';
import type { RegisterCollection } from 'rizom';
import { RizomError } from 'rizom/errors';
import type { Adapter } from 'rizom/db/index.server';
import { transformDocument } from '../tasks/transformDocument.server';
import type { LocalAPI } from '../localAPI/index.server';

type Args = {
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
};

export const findAll = async <T extends GenericDoc>(args: Args): Promise<T[]> => {
	const { config, event, locale, adapter, sort, limit, api, depth } = args;

	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentsRaw = await adapter.collection.findAll({
		slug: config.slug,
		sort,
		limit,
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
