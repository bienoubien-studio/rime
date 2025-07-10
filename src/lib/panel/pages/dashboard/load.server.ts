import { capitalize } from '$lib/util/string.js';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { DashboardEntry } from './types';
import type { CompiledCollection, Route } from '../../../types.js';

export const dashboardLoad = async (event: ServerLoadEvent) => {
	const { locale, user, rizom } = event.locals;

	const entries: DashboardEntry[] = [];

	const buildBaseEntry = (c: CompiledCollection): DashboardEntry => ({
		prototype: 'collection',
		description: c.panel && c.panel?.description ? c.panel.description : null,
		slug: c.slug,
		gender: c.label?.gender || 'm',
		canCreate: user && c.access.create(user, {}),
		link: `/panel/${c.slug}`,
		titleSingular: c.label.singular,
		title: c.label.plural
	});

	const getLastEdited = async (c: CompiledCollection) => {
		try {
			return await rizom.collection(c.slug).find({
				limit: 6,
				locale
			});
		} catch (err: any) {
			console.error(`Error fetching documents for collection ${c.slug}:`);
			console.error(err);
			return [];
		}
	};
	
	const promiseEntries = rizom.config.collections
		.filter((collection) => user && collection.access.read(user, {}))
		.filter((collection) => collection.panel !== false)
		.map(async (collection) => {
			if (collection.panel && collection.panel?.dashboard) {
				return getLastEdited(collection).then((docs) => ({ ...buildBaseEntry(collection), lastEdited: docs }));
			} else {
				return {
					...buildBaseEntry(collection),
					lastEdited: []
				};
			}
		});

	try {
		const collectionEntries = await Promise.all(promiseEntries);
		entries.push(...collectionEntries);
	} catch (err: any) {
		console.error('Error retrieving collection entries:');
		console.error(err);
	}

	for (const area of rizom.config.areas.filter(a => a.panel !== false)) {
		if (user && area.access.read(user, {})) {
			entries.push({
				prototype: 'area',
				description: area.panel && area.panel?.description || null,
				slug: area.slug,
				link: `/panel/${area.slug}`,
				title: area.label || capitalize(area.slug)
			});
		}
	}

	const aria: Route[] = [{ title: 'Dashboard', icon: 'dashboard', path: `/panel` }];

	return { entries, aria };
};
