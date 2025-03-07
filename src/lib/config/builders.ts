import type { Collection, Area } from 'rizom/types';

type OmitPreservingDiscrimination<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
type AreaWithoutSlug<S> = OmitPreservingDiscrimination<Area<S>, 'slug'>;

export function collection<S extends string>(
	slug: S,
	config: CollectionWithoutSlug<S>
): Collection<S> {
	return {
		...config,
		slug
	};
}

export function area<S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> {
	return {
		...config,
		slug
	};
}
