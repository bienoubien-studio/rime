import type { Collection } from '$lib/types';
import type { OmitPreservingDiscrimination } from '$lib/types/util';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
