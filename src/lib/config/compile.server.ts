import { compileFields } from 'rizom/fields/compile';
import type { BuiltConfig } from 'rizom/types';

export const compileConfig = (config: BuiltConfig) => {
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
