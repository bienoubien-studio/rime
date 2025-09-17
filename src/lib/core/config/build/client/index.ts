import type { AreaWithoutSlug } from '$lib/core/areas/config/types';
import type { CollectionWithoutSlug } from '$lib/core/collections/config/types';
import type { Area, Collection, Config } from '$lib/types';

export const defineConfig = (config: Config) => {
	return {
		collections: config.collections,
		areas: config.areas
	};
};

export const collection = <S extends string>(slug: S, incomingConfig: CollectionWithoutSlug<S>): Collection<S> => {
	//
	return {
		...incomingConfig,
		slug
	};
};

export const areas = <S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): Area<S> => {
	//
	return {
		...incomingConfig,
		slug
	};
};
