import { type ServerLoad } from '@sveltejs/kit';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { Route } from '$lib/panel/types.js';
import type { WithRequired } from 'better-auth/svelte';

/****************************************************/
/* Layout load
/****************************************************/
export function collectionLoad(slug: CollectionSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { rizom, locale, user } = event.locals;

		const collection = rizom.collection(slug);
		const authorizedCreate = collection.config.access.create(user, {});

		const docs = await collection.find({
			locale,
			draft: true
		});

		const aria: WithRequired<Partial<Route>, 'title'>[] = [
			{ title: 'Dashboard', icon: 'dashboard', path: `/panel` },
			{ title: collection.config.label.plural }
		];

		return {
			aria,
			docs,
			canCreate: authorizedCreate,
			slug,
			status: 200
		};
	};
	return load;
}
