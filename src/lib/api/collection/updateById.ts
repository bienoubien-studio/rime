import { extractData } from 'rizom/operations/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import type { CollectionSlug } from 'rizom/types/doc.js';
import { safe } from 'rizom/util/safe.js';
import { RizomError } from 'rizom/errors/index.js';

export default function (slug: CollectionSlug) {
	//
	async function PATCH(event: RequestEvent) {
		const { api, locale } = event.locals;

		const id = event.params.id;
		if (!id) throw new RizomError(RizomError.NOT_FOUND);

		const data = await extractData(event.request);

		const [error, doc] = await safe(
			api.collection(slug).updateById({
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
