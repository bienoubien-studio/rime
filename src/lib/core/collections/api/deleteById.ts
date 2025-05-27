import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { safe } from '$lib/util/safe.js';

export default function (slug: CollectionSlug) {
	//
	async function DELETE(event: RequestEvent) {
		const { rizom } = event.locals;
		const id = event.params.id || '';

		const [error] = await safe(rizom.collection(slug).deleteById({ id }));
		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ id });
	}

	return DELETE;
}
