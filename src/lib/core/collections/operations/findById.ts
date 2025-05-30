import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { Rizom } from '$lib/core/rizom.server.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import { transformDocument } from '$lib/core/operations/shared/transformDocument.server.js';

type Args = {
	id: string;
	versionId?: string;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	depth?: number;
	select?: string[];
	draft?: boolean
};

export const findById = async <T extends GenericDoc>(args: Args) => {
	const { config, event, id, versionId, locale, depth, select, draft } = args;
	const { rizom } = event.locals

	/****************************************************/
	// Authorized
	/****************************************************/
	const authorized = config.access.read(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug);
	}
	
	const documentRaw = await rizom.adapter.collection.findById({
		slug: config.slug,
		id,
		versionId,
		locale,
		select,
		draft
	});

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
