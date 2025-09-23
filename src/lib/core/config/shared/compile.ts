import type { BuiltArea, BuiltCollection, BuiltConfig, CompiledConfig } from '$lib/core/config/types.js';
import { compileFields } from '$lib/fields/compile.js';

export function compileConfig(config: BuiltConfig): CompiledConfig {
	return {
		...config,
		collections: config.collections.map(compileDocumentConfig),
		areas: config.areas.map(compileDocumentConfig)
	};
}

export const compileDocumentConfig = <T extends BuiltArea | BuiltCollection>(config: T) => {
	return {
		...config,
		fields: compileFields(config.fields)
	};
};
