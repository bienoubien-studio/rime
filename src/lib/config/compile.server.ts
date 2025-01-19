import { compileFields } from 'rizom/fields/compile.js';
import type { CompiledConfig } from 'rizom/types/config';

export const compileConfig = (config: CompiledConfig) => {
	return {
		...config,
		collections: config.collections.map((collection) => ({
			...collection,
			fields: compileFields(collection.fields)
		})),
		globals: config.globals.map((global) => ({
			...global,
			fields: compileFields(global.fields)
		}))
	};
};
