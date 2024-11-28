// Reexport your entry components here
import rizom from './rizom.server.js';
import handlers from './handlers/index.js';
import { buildConfig } from './config/build/index.js';
import type { BaseRegister } from './types/doc.js';

export { rizom, handlers, buildConfig };

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type { Config, CollectionConfig, GlobalConfig, BrowserConfig } from './types/config.js';
export type { RichTextNode, Link, LinkField } from './types/fields.js';
export type { UploadDoc, BaseDoc } from './types/doc.js';
export type { User } from 'rizom/types/auth.js';
export type { Plugin } from 'rizom/types/plugin.js';
export type { Rizom } from 'rizom/rizom.server.js';
export type { LocalAPI } from 'rizom/types/api.js';
export type { Navigation } from './panel/navigation.js';

declare module 'rizom' {
	// eslint-disable-next-line
	export interface Register extends BaseRegister {}
}
