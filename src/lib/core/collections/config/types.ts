import type { Collection } from '$lib/types';
import type { OmitPreservingDiscrimination } from '$lib/util/types';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
