import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';
import { normalizeQuery } from '$lib/adapter-sqlite/util.js';


export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { rizom, locale } = event.locals;
		const params = event.url.searchParams;

		const hasQueryParams = !!params.keys().filter(key => key.startsWith('where')).toArray().length;
		const query = hasQueryParams ? normalizeQuery(event.url.search.substring(1)) : undefined

		const apiParams = {
			locale: params.get('locale') || locale,
			sort: params.get('sort') || '-createdAt',
			depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
			limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
			offset: params.get('offset') ? parseInt(params.get('offset')!) : undefined,
			draft: params.get('draft') ? params.get('draft') === 'true' : undefined,
			query,
			select: params.get('select') ? params.get('select')!.split(',') : undefined
		};
		
		const [error, docs] = await safe(rizom.collection(slug).find(apiParams));
		if (error) {
			return handleError(error, { context: 'api' });
		}
		return json({ docs }, { status: 200 });
	}

	return GET;
}
