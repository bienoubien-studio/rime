import { type RequestEvent } from '@sveltejs/kit';
import { extractData } from 'rizom/operations/data.server.js';
import type { AreaSlug } from 'rizom/types/doc';
import { safe } from 'rizom/util/safe';
import { handleError } from 'rizom/errors/handler.server';

export default function (slug: AreaSlug) {
	const actions = {
		update: async (event: RequestEvent) => {
			const { api, locale } = event.locals;

			const [error, doc] = await safe(
				api.area(slug).update({
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
