import { json, type RequestEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types/doc';
import { handleAPIError } from '../handleError';

export default function (slug: PrototypeSlug) {
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
