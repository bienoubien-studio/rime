import type { AreaWithoutSlug } from '$lib/core/areas/config/types';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import type { Area } from '../types';

export const config = <S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): Area<S> => {
	//
	return {
		...incomingConfig,
		fields: [],
		slug
	};
};

export const hooks = Hooks;
