import rizom from './rizom.server.js';
import handlers from './handlers/index.js';
import { buildConfig } from './config/build/index.js';

export { rizom, handlers, buildConfig };

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type { Config, CollectionConfig, GlobalConfig, BrowserConfig } from './types/config.js';
export type { Link } from 'rizom/fields/link';
export type { UploadDoc, BaseDoc } from './types/doc.js';
export type { User } from 'rizom/types/auth.js';
export type { Plugin } from 'rizom/types/plugin.js';
export type { Rizom } from 'rizom/rizom.server.js';
export type { LocalAPI } from 'rizom/types/api.js';
export type { Navigation } from './panel/navigation.js';

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
	export interface RegisterCollectionSlug {} // Empty interface for users to extend
	// eslint-disable-next-line
	export interface RegisterGlobalSlug {}

	export interface Register {
		PrototypeSlug: Register['CollectionSlug'] | Register['GlobalSlug'];
		CollectionSlug: keyof RegisterCollectionSlug;
		GlobalSlug: keyof RegisterGlobalSlug;
		Plugins: RegisterPlugins;
		FieldsType: keyof RegisterFieldsType;
		AnyFormField: RegisterFormFields[keyof RegisterFormFields];
		AnyField: RegisterFields[keyof RegisterFields];
	}
}
