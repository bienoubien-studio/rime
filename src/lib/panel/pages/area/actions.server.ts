import { redirect, type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import type { AreaSlug } from '$lib/core/types/doc';
import { safe } from '$lib/util/safe';
import { handleError } from '$lib/core/errors/handler.server';

export default function (slug: AreaSlug) {
	const actions = {
		update: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			
			const versionId = event.url.searchParams.get('versionId') || undefined
			const draft = event.url.searchParams.get('draft') === 'true';
			
			const [error, doc] = await safe(
				rizom.area(slug).update({
					data: await extractData(event.request),
					versionId,
					draft,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (draft && 'versionId' in doc) {
				const referer = event.request.headers.get('referer')
				if (referer && referer.includes('/versions')) {
					return redirect(303, `/panel/${slug}/versions?versionId=${doc.versionId}`)
				} else {
					return redirect(303, `/panel/${slug}?versionId=${doc.versionId}`)
				}
			}

			return { doc };
		}
	};
	return actions;
}
