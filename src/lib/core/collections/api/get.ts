import qs from 'qs';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';
import type { Dic } from '$lib/util/types';


export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const params = event.url.searchParams;

		const hasQueryParams = !!params.keys().filter(key => key.startsWith('where')).toArray().length;
		const hasSelectParams = !!params.keys().filter(key => key === 'select').toArray().length;

		const apiParams:Dic = {
			locale: params.get('locale') || locale,
			sort: params.get('sort') || '-createdAt',
			depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
			limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
			offset: params.get('offset') ? parseInt(params.get('offset')!) : undefined
		};

		let apiMethod: 'find' | 'findAll' | 'select';
		
		if( hasSelectParams) {
			apiMethod = 'select';
			apiParams.select = params.get('select')?.split(',') || []
			if( hasQueryParams ){
				apiParams.query = qs.parse(event.url.search.substring(1))
			}
		} else if (hasQueryParams) {
			apiParams.query = qs.parse(event.url.search.substring(1))
			apiMethod = 'find';
		} else {
			apiMethod = 'findAll';
		}
		
		// @ts-expect-error params match function signature
		const [error, docs] = await safe(api.collection(slug)[apiMethod](apiParams));
		if (error) {
			return handleError(error, { context: 'api' });
		}
		return json({ docs }, { status: 200 });
	}

	return GET;
}
