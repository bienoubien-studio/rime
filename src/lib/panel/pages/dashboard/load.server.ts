import type { ServerLoadEvent } from '@sveltejs/kit';
import { capitalize } from '$lib/util/string.js';
import type { DashboardEntry } from './types';

export const dashboardLoad = async (event: ServerLoadEvent) => {
	const { locale, user, rizom } = event.locals;

	const entries: DashboardEntry[] = [];

	const requests = rizom.config.collections.map((collection) =>
		user && collection.access.read(user, {})
			? rizom
					.collection(collection.slug)
					.find({
						limit: 4,
						sort: '-updatedAt',
						locale
					})
					.then((docs: any[]) =>
						entries.push({
							prototype: 'collection',
							description: collection.description || null,
							slug: collection.slug,
							gender: collection.label?.gender || 'm',
							canCreate: user && collection.access.create(user, {}),
							link: `/panel/${collection.slug}`,
							titleSingular: collection.label.singular,
							title: collection.label.plural,
							lastEdited: docs
						})
					)
					.catch((err: any) => {
						console.error(collection.slug);
						console.error(err);
					})
			: false
	);

	try {
		await Promise.all(requests.filter(Boolean));
	} catch (err: any) {
		console.error(requests.filter(Boolean));
		console.error(err);
	}

	for (const area of rizom.config.areas) {
		if (user && area.access.read(user, {})) {
			entries.push({
				prototype: 'area',
				description: area.description || null,
				slug: area.slug,
				link: `/panel/${area.slug}`,
				title: area.label || capitalize(area.slug)
			});
		}
	}

	return { entries };
};
