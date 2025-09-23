import { augmentAuth } from '$lib/core/collections/config/augment-auth';
import { augmentMetas } from '$lib/core/collections/config/augment-metas';
import { augmentNested } from '$lib/core/collections/config/augment-nested';
import { augmentTitle } from '$lib/core/collections/config/augment-title';
import { augmentUpload } from '$lib/core/collections/config/augment-upload';
import { augmentUrl } from '$lib/core/collections/config/augment-url';
import { augmentVersions } from '$lib/core/collections/config/augment-versions';
import type { CollectionWithoutSlug } from '$lib/core/collections/config/types';
import type { BuiltCollection, Collection } from '$lib/core/config/types';
import type { Access } from '$lib/types';
import { FileText } from '@lucide/svelte';
import { augmentLabel } from './augment-label';

export const config = <S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): BuiltCollection => {
	//
	const collection: Collection<S> = { ...incomingConfig, slug };
	const initial = { ...collection };
	const withLabel = augmentLabel(initial);
	const withUpload = augmentUpload(withLabel);
	const withNested = augmentNested(withUpload);
	const withVersions = augmentVersions(withNested);
	const withUrl = augmentUrl(withVersions);
	const withAuth = augmentAuth(withUrl);
	const withMetas = augmentMetas(withAuth);
	const output = augmentTitle(withMetas);

	return {
		...output,
		slug: output.slug as BuiltCollection['slug'],
		type: 'collection',
		icon: output.icon || FileText,
		access: {
			create: (user) => !!user && !!user.isStaff,
			read: (user) => !!user && !!user.isStaff,
			update: (user) => !!user && !!user.isStaff,
			delete: (user) => !!user && !!user.isStaff,
			...output.access
		}
	};
};

export const access = (access: Access) => access;
