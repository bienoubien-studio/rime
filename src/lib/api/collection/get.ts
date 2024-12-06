import { json, type RequestEvent } from '@sveltejs/kit';
import qs from 'qs';
import { handleAPIError } from '../handleError';
import type { CollectionSlug } from 'rizom/types/doc';

export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const params = event.url.searchParams;
		const hasParams = params.toString();

		try {
			let docs;
			if (hasParams) {
				const queryParams = {
					locale: params.get('locale') || locale,
					sort: params.get('sort') || '-createdAt',
					depth: params.get('depth') ? parseInt(params.get('depth')!) : 0,
					limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
					query: qs.parse(event.url.search.substring(1))
				};
				docs = await api.collection(slug).find(queryParams);
			} else {
				docs = await api.collection(slug).findAll({ locale });
			}
			return json({ docs }, { status: 200 });
		} catch (err: any) {
			return handleAPIError(err);
		}
	}

	return GET;
}
