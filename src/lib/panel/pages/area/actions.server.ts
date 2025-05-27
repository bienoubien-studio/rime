import { type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import type { AreaSlug } from '$lib/core/types/doc';
import { safe } from '$lib/util/safe';
import { handleError } from '$lib/core/errors/handler.server';

export default function (slug: AreaSlug) {
	const actions = {
		update: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			const versionId = event.url.searchParams.get('versionId') || undefined

			const [error, doc] = await safe(
				rizom.area(slug).update({
					data: await extractData(event.request),
					versionId,
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
