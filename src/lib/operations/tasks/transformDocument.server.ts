import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from '$lib/types/config.js';
import type { RawDoc } from '$lib/types/doc.js';
import type { Adapter } from '$lib/sqlite/index.server.js';
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
	augment?: boolean
	withURL?: boolean
	withBlank?: boolean
}) => {
	const { raw, adapter, locale, event, api, depth, config, augment = true, withBlank = true, withURL = true } = args;

	let document = await adapter.transform.doc({
		doc: raw,
		slug: config.slug,
		locale,
		event,
		api,
		depth,
		withBlank
	});

	const configMap = buildConfigMap(document, config.fields);

	if (augment) {
		document = await augmentDocument({ document, config, event, locale });
	}

	document = await postprocessFields({
		document,
		configMap,
		event,
	});

	return document as T;
};
