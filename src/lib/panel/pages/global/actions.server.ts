import { type RequestEvent } from '@sveltejs/kit';
import extractData from '$lib/operations/preprocess/extract/data.server';
import type { GlobalSlug } from 'rizom/types/doc';
import { safe } from 'rizom/utils/safe';
import { handleError } from 'rizom/errors/handler.server';

export default function (slug: GlobalSlug) {
	const actions = {
		update: async (event: RequestEvent) => {
			const { api, locale } = event.locals;

			const [error, doc] = await safe(
				api.global(slug).update({
					data: await extractData(event.request),
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			return { doc };
		}
	};
	return actions;
}
