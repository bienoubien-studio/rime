import type { BuiltArea, BuiltCollection, BuiltConfig, CompiledConfig } from '$lib/core/config/types.js';
import type { FieldBuilder } from '$lib/core/fields/builders';
import type { Field } from '$lib/types';

/**
 * Compile fields on the whole config for areaas and collections
 */
export function compileConfig(config: BuiltConfig): CompiledConfig {
	return {
		...config,
		collections: config.collections.map(compileDocumentConfig),
		areas: config.areas.map(compileDocumentConfig)
	};
}

/**
 * Compile fields for the given area/collection
 * returns area/collections with compiled fields
 */
export const compileDocumentConfig = <T extends BuiltArea | BuiltCollection>(config: T) => {
	return {
		...config,
		fields: compileFields(config.fields)
	};
};

/**
 * Compile a list of fields and return it
 */
export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.map((f) => f.compile());
};
