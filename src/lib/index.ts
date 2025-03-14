import rizom from './rizom.server.js';
import handlers from './handlers/index.js';
import { buildConfig } from './config/build/index.js';
import type { Config } from 'rizom/types';
export { rizom, handlers, buildConfig };
export { FormFieldBuilder } from 'rizom/fields/builders/field.js';
export { area } from 'rizom/config/build/area/builder.js';
export { collection } from '$lib/config/build/collection/builder.js';
export const defineConfig = (config: Config) => config;

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type { Config, Collection, Area, BrowserConfig } from './types/config.js';
export type {
	CollectionHookBeforeUpsert,
	CollectionHookAfterUpsert,
	CollectionHookBeforeCreate,
	CollectionHookAfterCreate,
	CollectionHookBeforeUpdate,
	CollectionHookAfterUpdate,
	CollectionHookBeforeRead,
	CollectionHookBeforeDelete,
	CollectionHookAfterDelete,
	AreaHookBeforeRead,
	AreaHookBeforeUpdate,
	AreaHookAfterUpdate
} from './types/hooks.js';
export type { Link } from 'rizom/fields/link/index.js';
export type { UploadDoc, BaseDoc } from './types/doc.js';
export type { User } from 'rizom/types/auth.js';
export type { Plugin, Plugins } from 'rizom/plugins/index.js';
export type { Rizom } from 'rizom/rizom.server.js';
export type { LocalAPI } from 'rizom/types/api.js';
export type { Navigation } from './panel/navigation.js';
export type { FormField, AnyField } from 'rizom/types';

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
