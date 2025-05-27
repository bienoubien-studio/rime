import { type ServerLoad } from '@sveltejs/kit';
import type { CollectionSlug } from '$lib/core/types/doc.js';

/////////////////////////////////////////////
// Layout load
//////////////////////////////////////////////
export function layoutLoad(slug: CollectionSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { rizom, locale, user } = event.locals;

		const collection = rizom.collection(slug);
		const authorizedCreate = collection.config.access.create(user, {});

		const docs = await collection.findAll({ locale });

		return {
			docs,
			canCreate: authorizedCreate,
			slug,
			status: 200
		};
	};
	return load;
}
