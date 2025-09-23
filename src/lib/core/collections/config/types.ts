import type { Collection } from '$lib/core/config/types';
import type { OmitPreservingDiscrimination } from '$lib/util/types';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
