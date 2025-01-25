import { json, type RequestEvent } from '@sveltejs/kit';
import type { CollectionSlug } from 'rizom/types/doc';
import { handleAPIError } from '../handleError';

export default function (slug: CollectionSlug) {
	//
	async function DELETE(event: RequestEvent) {
		const { api } = event.locals;
		const id = event.params.id || '';

		try {
			await api.collection(slug).deleteById({ id });
		} catch (err: any) {
			return handleAPIError(err);
		}
		return json({ id });
	}

	return DELETE;
}
