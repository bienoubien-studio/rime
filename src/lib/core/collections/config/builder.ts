import { capitalize } from '$lib/util/string.js';
import type { BuiltCollection, Collection } from '$lib/core/config/types/index.js';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CollectionWithoutSlug } from './types.js';
import { augmentHooks } from './augment-hooks.js';
import { augmentMetas } from './augment-metas.js';
import { augmentTitle } from './augment-title.js';
import { augmentUpdload } from './augment-upload.js';
import { augmentNested } from './augment-nested.js';
import { augmentVersions } from './augment-versions.js';
import { augmentAuth } from './augment-auth.js';
import { FileText } from '@lucide/svelte';
import { augmentUrl } from './augment-url.js';

const addSlug = <S extends string>(slug: S, config: CollectionWithoutSlug<S>) => ({ ...config, slug });

/**
 * Function to define a collection
 */
export function collection<S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): BuiltCollection {
	const withSlug = addSlug(slug, incomingConfig);
	
	const withUpload = augmentUpdload(withSlug);
	const withNested = augmentNested(withUpload);
	const withVersions = augmentVersions(withNested);
	const withUrl = augmentUrl(withVersions);
	const withAuth = augmentAuth(withUrl);
	const withMetas = augmentMetas(withAuth);
	const withHooks = augmentHooks(withMetas);
	const output = augmentTitle(withHooks);
	
	return {
		...output,
		url: output.url as BuiltCollection['url'],
		slug: output.slug as BuiltCollection['slug'],
		type: 'collection',
		label: output.label ? output.label : { singular: capitalize(slug), plural: capitalize(slug), gender: 'm' },
		icon: output.icon || FileText,
		access: {
			create: (user?: User) => !!user,
			read: (user?: User) => !!user,
			update: (user?: User) => !!user,
			delete: (user?: User) => !!user,
			...output.access
		} 
	};
}
