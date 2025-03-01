import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { RegisterCollection } from 'rizom';
import { RizomError } from 'rizom/errors';
import type { Dic } from 'rizom/types/utility';
import { buildConfigMap } from '../tasks/configMap/index.server';
import { augmentDocument } from '../tasks/augmentDocument.server';
import { postprocessFields } from '../tasks/postProcessFields.server';

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

export const findAll = async <T extends RegisterCollection[CollectionSlug]>(
	args: Args
): Promise<T[]> => {
	const { config, event, locale, adapter, sort, limit, api, depth } = args;

	const authorized = config.access.read(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentsRaw = await adapter.collection.findAll({
		slug: config.slug,
		sort,
		limit,
		locale
	});

	const processDocument = async (docRaw: Dic) => {
		let documentRaw = await adapter.transform.doc({
			doc: docRaw,
			slug: config.slug,
			locale,
			event,
			api,
			depth
		});
		const configMap = buildConfigMap(documentRaw, config.fields);
		let document = augmentDocument({ document: documentRaw, config, event, locale });
		document = await postprocessFields({
			document,
			configMap,
			user: event.locals.user,
			api,
			locale
		});

		for (const hook of config.hooks?.beforeRead || []) {
			const result = await hook({
				doc: document as T,
				config,
				operation: 'read',
				api,
				rizom: event.locals.rizom,
				event
			});
			//@ts-ignore
			document = result.doc as T;
		}

		return document;
	};

	const documents = await Promise.all(documentsRaw.map((doc) => processDocument(doc)));

	return documents as T[];
};
