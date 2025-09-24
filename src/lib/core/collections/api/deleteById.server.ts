import { handleError } from '$lib/core/errors/handler.server.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { trycatch } from '$lib/util/function.js';
import { json, type RequestEvent } from '@sveltejs/kit';

export default function (slug: CollectionSlug) {
	//
	async function DELETE(event: RequestEvent) {
		const { rizom } = event.locals;
		const id = event.params.id || '';
		const [error] = await trycatch(() => rizom.collection(slug).deleteById({ id }));

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ id });
	}

	return DELETE;
}
