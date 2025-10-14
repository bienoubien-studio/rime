import type { BuiltArea, BuiltCollection } from '$lib/core/config/types.js';

export type WithPrototypes<T> = T & { collections: BuiltCollection[]; areas: BuiltArea[] };

export const augmentPrototypes = <
	const T extends { collections?: BuiltCollection[]; areas?: BuiltArea[] }
>(
	config: T
): WithPrototypes<T> => {
	return {
		...config,
		collections: config.collections || [],
		areas: config.areas || []
	} as const;
};
