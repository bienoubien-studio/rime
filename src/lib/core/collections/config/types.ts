import type { Collection } from '$lib/types';
import type { OmitPreservingDiscrimination } from '$lib/util/types';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
export type AugmentCollectionFn = (args: {
	config: CollectionWithoutSlug<any>;
	fields: CollectionWithoutSlug<any>['fields'];
}) => {
	config: CollectionWithoutSlug<any>;
	fields: CollectionWithoutSlug<any>['fields'];
};
