import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { RawDoc } from '$lib/core/types/doc.js';
import { buildConfigMap } from '../configMap/index.server.js';
import { augmentDocument } from './augmentDocument.server.js';
import { postprocessFields } from './postProcessFields.server.js';

export const transformDocument = async <T>(args: {
	raw: RawDoc;
	locale?: string;
	event: RequestEvent;
	depth?: number;
	config: CompiledArea | CompiledCollection;
	augment?: boolean;
	withURL?: boolean;
	withBlank?: boolean;
}) => {
	const { raw, locale, event, depth, config, augment = true, withBlank = true } = args;

	let document = await event.locals.rizom.adapter.transform.doc({
		doc: raw,
		slug: config.slug,
		locale,
		event,
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
		event
	});

	return document as T;
};
