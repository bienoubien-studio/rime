import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from 'rizom/types/config.js';
import type { RawDoc } from 'rizom/types/doc.js';
import type { Adapter } from 'rizom/sqlite/index.server.js';
import { buildConfigMap } from './configMap/index.server';
import { augmentDocument } from './augmentDocument.server';
import { postprocessFields } from './postProcessFields.server';
import type { LocalAPI } from '../localAPI/index.server';

export const transformDocument = async <T>(args: {
	raw: RawDoc;
	adapter: Adapter;
	locale?: string;
	event: RequestEvent;
	api: LocalAPI;
	depth?: number;
	config: CompiledArea | CompiledCollection;
}) => {
	const { raw, adapter, locale, event, api, depth, config } = args;

	let document = await adapter.transform.doc({
		doc: raw,
		slug: config.slug,
		locale,
		event,
		api,
		depth
	});

	const configMap = buildConfigMap(document, config.fields);
	document = await augmentDocument({ document, config, event, locale });

	document = await postprocessFields({
		document,
		configMap,
		user: event.locals.user,
		api,
		locale
	});

	return document as T;
};
