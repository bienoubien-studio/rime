import type { RequestEvent } from '@sveltejs/kit';
import type { CollectionSlug, Adapter, CompiledCollection, LocalAPI } from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { RizomError } from 'rizom/errors';
import { buildConfigMap } from '../tasks/configMap/index.server';
import { augmentDocument } from '../tasks/augmentDocument.server';
import { postprocessFields } from '../tasks/postProcessFields.server';

type Args = {
	id: string;
	locale?: string | undefined;
	config: CompiledCollection;
	api: LocalAPI;
	event: RequestEvent;
	adapter: Adapter;
	depth?: number;
};

export const findById = async <T extends RegisterCollection[CollectionSlug]>(args: Args) => {
	const { config, event, id, adapter, locale, api, depth } = args;
	const authorized = config.access.read(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentRaw = await adapter.collection.findById({
		slug: config.slug,
		id,
		locale
	});

	if (!documentRaw) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	documentRaw = await adapter.transform.doc({
		doc: documentRaw,
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
		document = result.doc as T;
	}

	return document as T;
};
