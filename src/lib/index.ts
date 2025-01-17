import rizom from './rizom.server.js';
import handlers from './handlers/index.js';
import { buildConfig } from './config/build/index.js';

export { rizom, handlers, buildConfig };
export { FormFieldBuilder } from 'rizom/fields/_builders/field.js';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type { Config, CollectionConfig, GlobalConfig, BrowserConfig } from './types/config.js';
export type { Link } from 'rizom/fields/link';
export type { UploadDoc, BaseDoc } from './types/doc.js';
export type { User } from 'rizom/types/auth.js';
export type { Plugin } from 'rizom/types/config.js';
export type { Rizom } from 'rizom/rizom.server.js';
export type { LocalAPI } from 'rizom/types/api.js';
export type { Navigation } from './panel/navigation.js';
export type { FormField, AnyField } from 'rizom/types';

declare module 'rizom' {
	// eslint-disable-next-line
	interface RegisterFieldsType {}
	// eslint-disable-next-line
	interface RegisterFormFields {}
	// eslint-disable-next-line
	interface RegisterFields {}
	// eslint-disable-next-line
	interface RegisterPlugins {}
	// eslint-disable-next-line
	export interface RegisterCollection {}
	// eslint-disable-next-line
	export interface RegisterGlobal {}

	export interface Register {
		PrototypeSlug: keyof RegisterCollection | keyof RegisterGlobal;
		CollectionSlug: keyof RegisterCollection;
		GlobalSlug: keyof RegisterGlobal;
		Plugins: RegisterPlugins;
		FieldsType: keyof RegisterFieldsType;
		AnyFormField: RegisterFormFields[keyof RegisterFormFields];
		AnyField: RegisterFields[keyof RegisterFields];
	}
}

export type GetRegisterType<K extends keyof Register> = Register[K];
