import type { CollectionSlug } from '$lib/core/types/doc.js';
import { error, json, type RequestEvent } from '@sveltejs/kit';

export default function (slug: CollectionSlug) {
	//
	async function POST(event: RequestEvent) {
		const { rime } = event.locals;

		const collection = rime.collection(slug);
		if (!event.params.id) throw error(404);

		const newId = await collection.duplicate({ id: event.params.id });

		return json({ id: newId });
	}

	return POST;
}
