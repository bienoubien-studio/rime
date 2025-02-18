import type { CollectionConfig, AreaConfig } from 'rizom/types';

type OmitPreservingDiscrimination<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

type CollectionConfigWithoutSlug<S> = OmitPreservingDiscrimination<CollectionConfig<S>, 'slug'>;
type AreaConfigWithoutSlug<S> = OmitPreservingDiscrimination<AreaConfig<S>, 'slug'>;

export function collection<S extends string>(
	slug: S,
	config: CollectionConfigWithoutSlug<S>
): CollectionConfig<S> {
	return {
		...config,
		slug
	};
}

export function area<S extends string>(slug: S, config: AreaConfigWithoutSlug<S>): AreaConfig<S> {
	return {
		...config,
		slug
	};
}
