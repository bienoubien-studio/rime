import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI, CompiledArea, GenericDoc, Adapter } from 'rizom/types';
import { RizomError } from 'rizom/errors';
import { augmentDocument } from '../tasks/augmentDocument.server';
import { buildConfigMap } from '../tasks/configMap/index.server';
import { postprocessFields } from '../tasks/postProcessFields.server';

type FindArgs = {
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	depth?: number;
};

export const find = async <T extends GenericDoc = GenericDoc>(args: FindArgs): Promise<T> => {
	//
	const { config, event, adapter, locale, api, depth } = args;

	const authorized = config.access.read(event.locals.user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	let documentRaw = await adapter.area.get({
		slug: config.slug,
		locale
	});

	documentRaw = await adapter.transform.doc({
		doc: documentRaw,
		slug: config.slug,
		locale,
		event,
		api,
		depth
	});

	const configMap = buildConfigMap(documentRaw, config.fields);
	let document = augmentDocument({ document: documentRaw, config, event, locale }) as GenericDoc;
	document = await postprocessFields({ document, configMap, user: event.locals.user, api, locale });

	for (const hook of config.hooks?.beforeRead || []) {
		const result = await hook({
			doc: document,
			config,
			operation: 'read',
			api,
			rizom: event.locals.rizom,
			event
		});
		document = result.doc;
	}

	return document as T;
};
