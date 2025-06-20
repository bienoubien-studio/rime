import { capitalize } from '$lib/util/string.js';
import type { Collection } from '$lib/core/config/types/index.js';
import type { User } from '$lib/core/collections/auth/types.js';
import type { CollectionWithoutSlug } from './types.js';
import { PANEL_USERS } from '$lib/core/constant.js';
import { augmentHooks } from './augment-hooks.js';
import { augmentMetas } from './augment-metas.js';
import { augmentTitle } from './augment-title.js';
import { augmentUpdload } from './augment-upload.js';
import { augmentNested } from './augment-nested.js';
import { augmentVersions } from './augment-versions.js';
import { augmentAuth } from './augment-auth.js';
import { FileText } from '@lucide/svelte';

const addSlug = <S extends string>(slug: S, config: CollectionWithoutSlug<S>): Collection<S> => ({ ...config, slug });

/**
 * Function to define a collection
 */
export function collection<S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): Collection<S> {
	
	let config = addSlug(slug, incomingConfig);
	let fields: typeof config.fields = [...config.fields];
	
	({ config, fields } = augmentUpdload({ config, fields }));
	({ config, fields } = augmentNested({ config, fields }));
	({ config, fields } = augmentVersions({ config, fields }));

	if (config.auth && slug !== PANEL_USERS) {
		({ config, fields } = augmentAuth({ config, fields }));
	}

	({ config, fields } = augmentMetas({ config, fields }));

	config = augmentHooks(config);
	config = augmentTitle(config);

	return {
		...config,
		slug,
		label: config.label ? config.label : { singular: capitalize(slug), plural: capitalize(slug), gender: 'm' },
		fields,
		icon: config.icon || FileText,
		access: {
			create: (user?: User) => !!user,
			read: (user?: User) => !!user,
			update: (user?: User) => !!user,
			delete: (user?: User) => !!user,
			...config.access
		}
	};
}
