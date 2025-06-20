import { extractData } from '$lib/core/operations/shared/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { AreaSlug } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/trycatch.js';
import { PARAMS } from '$lib/core/constant.js';

export default function (slug: AreaSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom, locale } = event.locals;

		const paramLocale = event.url.searchParams.get(PARAMS.LOCALE);
		const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft = event.url.searchParams.get(PARAMS.DRAFT)
			? event.url.searchParams.get(PARAMS.DRAFT) === 'true'
			: undefined;
		
		const [extractError, data] = await trycatch(extractData(event.request));
		if (extractError) {
			return handleError(extractError, { context: 'api' });
		}
		
		const [error, doc] = await trycatch(
			rizom.area(slug).update({
				data,
				versionId,
				draft,
				locale: paramLocale || data.locale || locale
			})
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return POST;
}
