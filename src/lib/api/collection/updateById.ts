import extractData from '$lib/operations/preprocess/extract/data.server';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server';
import type { CollectionSlug } from 'rizom/types/doc';
import { safe } from 'rizom/utils/safe';

export default function (slug: CollectionSlug) {
	//
	async function PATCH(event: RequestEvent) {
		const { api, locale } = event.locals;
		const id = event.params.id;

		const collection = api.collection(slug);
		const data = await extractData(event.request);

		const [error, doc] = await safe(
			collection.updateById({
				id,
				data,
				locale: data.locale || locale
			})
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return PATCH;
}
