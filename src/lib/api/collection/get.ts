import qs from 'qs';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
import { safe } from 'rizom/util/safe.js';

export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const params = event.url.searchParams;
		const hasParams = params.toString();

		let apiParams;
		let apiMethod: 'find' | 'findAll';

		if (hasParams) {
			apiParams = {
				locale: params.get('locale') || locale,
				sort: params.get('sort') || '-createdAt',
				depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
				limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
				query: qs.parse(event.url.search.substring(1))
			};
			apiMethod = 'find';
		} else {
			apiParams = { locale };
			apiMethod = 'findAll';
		}

		// @ts-expect-error params match the apiMethod signature
		const [error, docs] = await safe(api.collection(slug)[apiMethod](apiParams));
		if (error) {
			return handleError(error, { context: 'api' });
		}
		return json({ docs }, { status: 200 });
	}

	return GET;
}
