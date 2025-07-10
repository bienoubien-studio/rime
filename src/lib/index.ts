import rizom from '$lib/core/cms.server.js';
import handlers from '$lib/core/handlers/index.js';
import type { Config } from '$lib/core/config/types/index.js';

export { rizom, handlers };
export { FormFieldBuilder, FieldBuilder } from '$lib/fields/builders/field.server.js';
export { area } from '$lib/core/areas/config/builder.js';
export { collection } from '$lib/core/collections/config/builder.js';
export { Hooks } from '$lib/core/operations/hooks/index.js';

export const defineConfig = (config: Config): Config => config;

declare module 'rizom' {
	// Register interfaces for plugin architecture
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface RegisterPlugins {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface RegisterCollection {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface RegisterArea {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export interface RegisterSchema {}

	// Main Register interface that combines all registrations
	export interface Register {
		PrototypeSlug: keyof RegisterCollection | keyof RegisterArea;
		CollectionSlug: keyof RegisterCollection;
		AreaSlug: keyof RegisterArea;
		Plugins: RegisterPlugins;
		Schema: RegisterSchema['schema'];
		Tables: RegisterSchema['tables'];
	}
}

// Utility type for accessing register types
export type GetRegisterType<K extends keyof Register> = Register[K];
