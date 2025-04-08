import rizom from './rizom.server.js';
import handlers from './handlers/index.js';

export { rizom, handlers };
export { FormFieldBuilder, FieldBuilder } from 'rizom/fields/builders/field.js';
export { area } from 'rizom/config/build/area/builder.js';
export { collection } from '$lib/config/build/collection/builder.js';

import type { Config } from 'rizom/types/config.js';
export const defineConfig = (config: Config) => config;

declare module 'rizom' {
	export interface RegisterFieldsType {}
	export interface RegisterFormFields {}
	export interface RegisterFields {}
	export interface RegisterPlugins {}
	export interface RegisterCollection {}
	export interface RegisterArea {}

	export interface Register {
		PrototypeSlug: keyof RegisterCollection | keyof RegisterArea;
		CollectionSlug: keyof RegisterCollection;
		AreaSlug: keyof RegisterArea;
		Plugins: RegisterPlugins;
		FieldsType: keyof RegisterFieldsType;
		AnyFormField: RegisterFormFields[keyof RegisterFormFields];
		AnyField: RegisterFields[keyof RegisterFields];
	}
}

export type GetRegisterType<K extends keyof Register> = Register[K];
