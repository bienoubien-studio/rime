import { compileFields } from 'rizom/fields/compile.js';
import type { BuiltConfig, CompiledConfig } from 'rizom/types/config.js';

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
