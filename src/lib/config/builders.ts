import type { CollectionConfig, GlobalConfig } from 'rizom/types';

type OmitPreservingDiscrimination<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

type CollectionConfigWithoutSlug<S> = OmitPreservingDiscrimination<CollectionConfig<S>, 'slug'>;
type GlobalConfigWithoutSlug<S> = OmitPreservingDiscrimination<GlobalConfig<S>, 'slug'>;

export function collection<S extends string>(
	slug: S,
	config: CollectionConfigWithoutSlug<S>
): CollectionConfig<S> {
	return {
		...config,
		slug
	};
}

export function global<S extends string>(
	slug: S,
	config: GlobalConfigWithoutSlug<S>
): GlobalConfig<S> {
	return {
		...config,
		slug
	};
}
