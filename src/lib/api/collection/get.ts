import qs from 'qs';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/errors/handler.server.js';
import type { CollectionSlug } from '$lib/types/doc.js';
import { safe } from '$lib/util/safe.js';


export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const params = event.url.searchParams;

		const hasQueryParams = !!params.keys().filter(key => key.startsWith('where')).toArray().length;

		let apiParams;
		let apiMethod: 'find' | 'findAll';

		if (hasQueryParams) {
			apiParams = {
				locale: params.get('locale') || locale,
				sort: params.get('sort') || '-createdAt',
				depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
				limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
				offset: params.get('offset') ? parseInt(params.get('offset')!) : undefined,
				query: qs.parse(event.url.search.substring(1))
			};
			apiMethod = 'find';
		} else {
			apiParams = {
				locale: params.get('locale') || locale,
				sort: params.get('sort') || '-createdAt',
				depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
				limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
				offset: params.get('offset') ? parseInt(params.get('offset')!) : undefined,
			};
			apiMethod = 'findAll';
		}
		
		// @ts-ignore params match function signature
		const [error, docs] = await safe(api.collection(slug)[apiMethod](apiParams));
		if (error) {
			return handleError(error, { context: 'api' });
		}
		return json({ docs }, { status: 200 });
	}

	return GET;
}
