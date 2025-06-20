import type { Collection } from '$lib/types';
import type { OmitPreservingDiscrimination } from '$lib/util/types';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
export type AugmentCollectionFn = (args: {
	config: Collection<any>;
	fields: Collection<any>['fields'];
}) => {
	config: Collection<any>;
	fields: Collection<any>['fields'];
};
