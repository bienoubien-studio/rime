import { PARAMS } from '$lib/core/constant.js';
import { handleError } from '$lib/core/errors/handler.server.js';
import { extractData } from '$lib/core/operations/extract-data.server.js';
import type { AreaSlug } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/trycatch.js';
import { json, type RequestEvent } from '@sveltejs/kit';

export default function (slug: AreaSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rizom } = event.locals;

		const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft = event.url.searchParams.get(PARAMS.DRAFT)
			? event.url.searchParams.get(PARAMS.DRAFT) === 'true'
			: undefined;

		const [extractError, data] = await trycatch(() => extractData(event.request));
		if (extractError) {
			return handleError(extractError, { context: 'api' });
		}

		if (data.locale) {
			rizom.setLocale(data.locale);
		}

		const [error, doc] = await trycatch(() =>
			rizom.area(slug).update({
				data,
				versionId,
				draft,
				locale: rizom.getLocale()
			})
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return POST;
}
