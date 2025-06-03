import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';
import { PARAMS } from '$lib/core/constant.js';

export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { rizom, locale } = event.locals;
		const { id } = event.params;

		const paramLocale = event.url.searchParams.get(PARAMS.LOCALE);
		const paramDepth = event.url.searchParams.get(PARAMS.DEPTH);
		const paramDraft = event.url.searchParams.get(PARAMS.DRAFT)
		const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft =  paramDraft ? paramDraft === 'true' : undefined
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;
		
		const [error, doc] = await safe(
			rizom.collection(slug).findById({ 
				id, 
				locale: paramLocale || locale, 
				depth,
				draft,
				versionId
			})
		);
		
		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}
