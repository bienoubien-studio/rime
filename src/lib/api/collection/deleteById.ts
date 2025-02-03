import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import type { CollectionSlug } from 'rizom/types/doc';
import { safe } from 'rizom/utils/safe';

export default function (slug: CollectionSlug) {
	//
	async function DELETE(event: RequestEvent) {
		const { api } = event.locals;
		const id = event.params.id || '';

		const [error, success] = await safe(api.collection(slug).deleteById({ id }));
		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ id });
	}

	return DELETE;
}
