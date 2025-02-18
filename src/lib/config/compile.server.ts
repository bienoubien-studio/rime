import { compileFields } from 'rizom/fields/compile.js';
import type { BuiltConfig } from 'rizom/types/config';

export const compileConfig = (config: BuiltConfig) => {
	return {
		...config,
		collections: config.collections.map((collection) => ({
			...collection,
			fields: compileFields(collection.fields)
		})),
		areas: config.areas.map((area) => ({
			...area,
			fields: compileFields(area.fields)
		}))
	};
};
