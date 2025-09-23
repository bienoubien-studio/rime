import { augmentAuthServer } from '$lib/core/collections/config/augment-auth.server';
import { augmentHooks } from '$lib/core/collections/config/augment-hooks';
import { augmentMetas } from '$lib/core/collections/config/augment-metas';
import { augmentNestedServer } from '$lib/core/collections/config/augment-nested.server';
import { augmentTitle } from '$lib/core/collections/config/augment-title';
import { augmentUploadServer } from '$lib/core/collections/config/augment-upload.server';
import { augmentUrl } from '$lib/core/collections/config/augment-url';
import { augmentVersions } from '$lib/core/collections/config/augment-versions';
import type { CollectionWithoutSlug } from '$lib/core/collections/config/types';
import type { BuiltCollection, Collection } from '$lib/core/config/types';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import { FileText } from '@lucide/svelte';
import { augmentLabel } from './augment-label';

export const config = <S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): BuiltCollection => {
	//
	const collection: Collection<S> = { ...incomingConfig, slug };
	const initial = { ...collection };
	const withLabel = augmentLabel(initial);
	const withUpload = augmentUploadServer(withLabel);
	const withNested = augmentNestedServer(withUpload);
	const withVersions = augmentVersions(withNested);
	const withUrl = augmentUrl(withVersions);
	const withAuth = augmentAuthServer(withUrl);
	const withMetas = augmentMetas(withAuth);
	const withHooks = augmentHooks(withMetas);
	const output = augmentTitle(withHooks);

	return {
		...output,
		$url: output.$url as BuiltCollection['$url'],
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

export const hook = Hooks;
