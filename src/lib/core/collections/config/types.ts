import type { BuiltCollection, Collection } from '$lib/types';
import type { OmitPreservingDiscrimination } from '$lib/util/types';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;

export type AugmentCollectionFn<Output extends Partial<BuiltCollection>> = <Input extends Partial<BuiltCollection>>(
	config: Input
) => Output;
