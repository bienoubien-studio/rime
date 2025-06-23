import type { OmitPreservingDiscrimination } from '$lib/util/types.js';
import type { Area } from '../../../types.js';

export type AreaWithoutSlug<S> = OmitPreservingDiscrimination<Area<S>, 'slug'>;

export type AugmentAreaFn = (args: { config: Area<any>; fields: Area<any>['fields'] }) => {
	config: Area<any>;
	fields: Area<any>['fields'];
};
