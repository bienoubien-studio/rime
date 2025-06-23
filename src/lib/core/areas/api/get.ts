import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { AreaSlug } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/trycatch.js';
import type { Dic } from '$lib/util/types';
import { PARAMS } from '$lib/core/constant.js';

export default function (slug: AreaSlug) {
	//
	async function GET(event: RequestEvent) {
		const { rizom } = event.locals;

		const paramDepth = event.url.searchParams.get(PARAMS.DEPTH);
		const paramSelect = event.url.searchParams.get(PARAMS.SELECT);
		const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft = event.url.searchParams.get(PARAMS.DRAFT)
			? event.url.searchParams.get(PARAMS.DRAFT) === 'true'
			: undefined;
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;

		const params: Dic = {
			locale: rizom.getLocale(),
			draft,
			versionId,
			depth
		};
		
		if (paramSelect) {
			params.select = paramSelect.split(',');
		}

		const [error, doc] = await trycatch(rizom.area(slug).find(params));

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}
