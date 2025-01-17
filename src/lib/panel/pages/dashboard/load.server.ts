import type { ServerLoadEvent } from '@sveltejs/kit';
import { capitalize } from 'rizom/utils/string.js';
import type { DocPrototype, GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { BuiltCollectionConfig } from 'rizom/types/config.js';

export type DashboardEntry = {
	slug: PrototypeSlug;
	title: string;
	titleSingular?: string;
	link: string;
	canCreate?: boolean;
	prototype: DocPrototype;
	lastEdited?: GenericDoc[];
};

export const dashboardLoad = async (event: ServerLoadEvent) => {
	const { rizom, locale, user, api } = event.locals;

	const entries: DashboardEntry[] = [];

	const requests = rizom.config.collections.map((collection: BuiltCollectionConfig) =>
		user && collection.access.read(user)
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
							canCreate: user && collection.access.create(user),
							link: `/panel/${collection.slug}`,
							titleSingular: collection.label.singular,
							title: collection.label.singular,
							lastEdited: docs
						})
					)
					.catch((err: any) => {
						console.log(collection.slug);
						console.error(err);
					})
			: false
	);

	try {
		await Promise.all(requests.filter(Boolean));
	} catch (err: any) {
		console.log(requests.filter(Boolean));
		console.error(err);
	}

	for (const global of rizom.config.globals) {
		if (user && global.access.read(user)) {
			entries.push({
				prototype: 'global',
				slug: global.slug,
				link: `/panel/${global.slug}`,
				title: global.label || capitalize(global.slug)
			});
		}
	}

	return { entries };
};
