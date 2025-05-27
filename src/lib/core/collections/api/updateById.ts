import { extractData } from '$lib/core/operations/shared/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';
import { RizomError } from '$lib/core/errors/index.js';

export default function (slug: CollectionSlug) {
	//
	async function PATCH(event: RequestEvent) {
		const { rizom, locale } = event.locals;

		const id = event.params.id;
		if (!id) throw new RizomError(RizomError.NOT_FOUND);

		const data = await extractData(event.request);

		const [error, doc] = await safe(
			rizom.collection(slug).updateById({
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
