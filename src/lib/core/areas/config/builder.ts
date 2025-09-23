import { augmentMetas } from '$lib/core/areas/config/augment-metas';
import { augmentTitle } from '$lib/core/areas/config/augment-title';
import { augmentUrl } from '$lib/core/areas/config/augment-url';
import { augmentVersions } from '$lib/core/areas/config/augment-versions';
import type { AreaWithoutSlug } from '$lib/core/areas/config/types';
import type { Area, BuiltArea } from '$lib/core/config/types';
import { capitalize } from '$lib/util/string';
import { FileText } from '@lucide/svelte';

export const config = <S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): BuiltArea => {
	const area: Area<S> = { ...incomingConfig, slug };

	const initial = { ...area };
	const withMetas = augmentMetas(initial);
	const withVersions = augmentVersions(withMetas);
	const withUrl = augmentUrl(withVersions);
	const output = augmentTitle(withUrl);

	return {
		...output,
		type: 'area',
		slug: output.slug as BuiltArea['slug'],
		icon: output.icon || FileText,
		label: output.label ? output.label : capitalize(area.slug),
		access: {
			create: (user) => !!user && !!user.isStaff,
			read: (user) => !!user && !!user.isStaff,
			update: (user) => !!user && !!user.isStaff,
			delete: (user) => !!user && !!user.isStaff,
			...output.access
		}
	};
};
