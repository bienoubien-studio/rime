import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { RawDoc } from '$lib/core/types/doc.js';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { buildConfigMap } from '../configMap/index.server.js';
import { augmentDocument } from './augmentDocument.server.js';
import { postprocessFields } from './postProcessFields.server.js';
import type { LocalAPI } from '../local-api.server.js';

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
	const { raw, adapter, locale, event, api, depth, config, augment = true, withBlank = true } = args;

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
