import { capitalize } from '$lib/util/string.js';
import { augmentTitle } from './augment-title.js';
import { augmentMetas } from './augment-metas.js';
import type { Area, BuiltArea } from '$lib/core/config/types/index.js';
import type { AreaWithoutSlug } from './types.js';
import { augmentVersions } from './augment-versions.js';
import { FileText } from '@lucide/svelte';
import { augmentHooks } from './augment-hooks.js';
import { augmentUrl } from './augment-url.js';

const addSlug = <S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> => ({ ...config, slug });

/**
 * Function to define an Area
 */
export function area<S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): BuiltArea {
	const withSlug = addSlug(slug, incomingConfig);

	const withTitle = augmentTitle(withSlug);
	const withMetas = augmentMetas(withTitle);
	const withVersions = augmentVersions(withMetas);
	const withUrl = augmentUrl(withVersions);
	const output = augmentHooks(withUrl);
		
	return {
		...output,
		type: 'area',
		slug: output.slug as BuiltArea['slug'],
		url: output.url as BuiltArea['url'],
		icon: output.icon || FileText,
		label: output.label ? output.label : capitalize(slug),
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...output.access
		}
	};
}