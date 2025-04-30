import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/sqlite/index.server.js';
import type { CompiledCollection } from '$lib/types/config.js';
import type { LocalAPI } from '$lib/operations/localAPI/index.server.js';
import type { GenericDoc, CollectionSlug } from '$lib/types/doc.js';
import type { RegisterCollection } from 'rizom';
import { RizomError } from '$lib/errors/index.js';
import { transformDocument } from '../tasks/transformDocument.server.js';

type Args = {
	id: string;
	locale?: string | undefined;
	config: CompiledCollection;
	api: LocalAPI;
	event: RequestEvent;
	adapter: Adapter;
	depth?: number;
};

export const findById = async <T extends GenericDoc>(args: Args) => {
	const { config, event, id, adapter, locale, api, depth } = args;

	/////////////////////////////////////////////
	// Authorized
	//////////////////////////////////////////////
	const authorized = config.access.read(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug );
	}

	let documentRaw = await adapter.collection.findById({
		slug: config.slug,
		id,
		locale
	});

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
