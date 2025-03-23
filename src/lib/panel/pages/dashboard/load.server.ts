import type { ServerLoadEvent } from '@sveltejs/kit';
import { capitalize } from 'rizom/util/string.js';
import type { CollectionSlug, GenericDoc, AreaSlug } from 'rizom/types/doc.js';

export type DashboardEntry =
	| {
			slug: CollectionSlug;
			title: string;
			gender: 'm' | 'f';
			titleSingular: string;
			link: string;
			canCreate?: boolean;
			prototype: 'collection';
			lastEdited?: GenericDoc[];
	  }
	| {
			slug: AreaSlug;
			title: string;
			link: string;
			prototype: 'area';
			lastEdited?: GenericDoc[];
	  };

export const dashboardLoad = async (event: ServerLoadEvent) => {
	const { rizom, locale, user, api } = event.locals;

	const entries: DashboardEntry[] = [];

	const requests = rizom.config.collections.map((collection) =>
		user && collection.access.read(user, {})
			? api
					.collection(collection.slug)
					.findAll({
						limit: 4,
						sort: '-updatedAt',
						locale
					})
					.then((docs: any[]) =>
						entries.push({
							prototype: 'collection',
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
				slug: area.slug,
				link: `/panel/${area.slug}`,
				title: area.label || capitalize(area.slug)
			});
		}
	}

	return { entries };
};
