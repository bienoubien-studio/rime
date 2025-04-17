import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/errors/handler.server.js';
import type { CollectionSlug } from '$lib/types/doc.js';
import { safe } from '$lib/util/safe.js';

export default function (slug: CollectionSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const { id } = event.params;

		const paramLocale = event.url.searchParams.get('locale');
		const paramDepth = event.url.searchParams.get('depth');
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;

		const [error, doc] = await safe(
			api.collection(slug).findById({ id, locale: paramLocale || locale, depth })
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}
