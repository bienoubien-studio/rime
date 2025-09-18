import { compileFields } from '$lib/fields/compile.js';
import type { BuiltConfig, CompiledConfig } from '$lib/core/config/types.js';

export const compileConfig = (config: BuiltConfig): CompiledConfig => {
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
