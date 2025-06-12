import { extractData } from '$lib/core/operations/shared/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';
import { RizomError } from '$lib/core/errors/index.js';
import { PARAMS } from '$lib/core/constant.js';

export default function (slug: CollectionSlug) {
	//
	async function PATCH(event: RequestEvent) {
		const { rizom, locale } = event.locals;

		const id = event.params.id;
		if (!id) throw new RizomError(RizomError.NOT_FOUND);

		const paramLocale = event.url.searchParams.get(PARAMS.LOCALE);
		const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
		const draft = event.url.searchParams.get(PARAMS.DRAFT)
			? event.url.searchParams.get(PARAMS.DRAFT) === 'true'
			: undefined;
		const data = await extractData(event.request);

		const [error, doc] = await safe(
			rizom.collection(slug).updateById({
				id,
				data,
				locale: paramLocale || data.locale || locale,
				versionId,
				draft
			})
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return PATCH;
}
