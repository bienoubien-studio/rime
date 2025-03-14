import type { Collection } from 'rizom/types';
import type { OmitPreservingDiscrimination } from 'rizom/types/util';

export type CollectionWithoutSlug<S> = OmitPreservingDiscrimination<Collection<S>, 'slug'>;
