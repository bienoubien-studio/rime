import type { AreaWithoutSlug } from '$lib/core/areas/config/types';
import type { Access } from '$lib/types';
import type { Area } from '../types';

export const config = <S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): Area<S> => {
	//
	return {
		...incomingConfig,
		fields: [],
		slug
	};
};

export const access = (access: Access) => access;
