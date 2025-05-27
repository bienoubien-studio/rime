import { extractData } from '$lib/core/operations/shared/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { AreaSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';

export default function (slug: AreaSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');
		const data = await extractData(event.request);

		const [error, doc] = await safe(
			rizom.area(slug).update({ data, locale: paramLocale || data.locale || locale })
		);
		
		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return POST;
}
