import type { CollectionWithoutSlug } from '$lib/core/collections/config/types';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import type { Access } from '$lib/types';
import type { Collection, CollectionHooks, UrlDefinition } from '../types';

export const config = <S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): Collection<S> => {
	//
	return {
		...incomingConfig,
		fields: [],
		slug
	};
};

export const hook = Hooks;

export const hooks = (hooks: CollectionHooks<any>) => hooks;
export const access = (access: Access) => access;
export const url = (url: UrlDefinition) => url;
