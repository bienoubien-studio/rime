import type { RequestHandler } from '@sveltejs/kit';
import type { Access, User } from './auth.js';
import type { AnyField, FieldsType, Option } from './fields.js';
import type { GenericDoc } from './doc.js';
import type { CollectionHooks, GlobalHooks } from './hooks.js';
import type { ComponentType } from 'svelte.js';
import type { AtLeastOne, WithoutBuilders, WithRequired } from './utility.js';
import type { MaybeAsyncFunction, Plugin } from './plugin.js';
import type { GetRegisterType } from 'rizom';
import type { FieldBuilder } from 'rizom/fields/_builders/field.js';
import type { FieldsComponents } from './panel.js';
import type { PanelLanguage } from 'rizom/panel/i18n/index.js';

export type DocumentPrototype = 'collection' | 'global';

export interface Config {
	/** The database name inside ./db folder */
	database: string;
	/** If config.siteUrl is defined, a preview button is added
	on the panel dahsboard, pointing to this url  */
	siteUrl?: string;
	/** List of CollectionConfig  */
	collections: CollectionConfig[];
	/** List of GlobalConfig  */
	globals: GlobalConfig[];
	/** Define locales that will be enabled
	 * @example
	 * ```typescript
	 * localization: {
	 *   locales: [
	 *     {
	 *       code: 'fr',
	 *       label: 'Français',
	 *       bcp47: 'fr-FR'
	 *     },
	 *     {
	 *       code: 'en',
	 *       label: 'English',
	 *       bcp47: 'en-US'
	 *     }
	 *   ],
	 *   default: 'en'
	 * }
	 * ```
	 */
	localization?: LocalizationConfig;
	/** Define wich hosts are allowed to query the API
	 *
	 * @example
	 * ```typescript
	 * trustedOrigins: ['www.external.com']
	 * ```
	 */
	trustedOrigins?: string[];
	panel?: {
		access?: (user: User | undefined) => boolean;
		routes?: Record<string, CustomPanelRoute>;
		users?: PanelUsersConfig;
		language?: PanelLanguage;
		components?: {
			header?: ComponentType[];
			dashboard?: ComponentType;
		};
	};
	cache?: { isEnabled?: (event: RequestEvent) => boolean };
	routes?: Record<string, RouteConfig>;
	plugins?: ReturnType<Plugin>[];
	custom?: {
		browser?: Record<string, any>;
		server?: Record<string, any>;
	};
}

export type PanelUsersConfig = {
	roles?: Option[];
	group?: string;
	access?: Access;
	label?: CollectionConfigLabel;
	fields?: FieldBuilder<AnyField>[];
};

export type RouteConfig = {
	POST?: RequestHandler;
	GET?: RequestHandler;
	PATCH?: RequestHandler;
	DELETE?: RequestHandler;
};

export type LocalizationConfig = {
	locales: LocaleConfig[];
	default: string;
};

export type LocaleConfig = {
	code: string;
	label: string;
	bcp47: string;
};

type CollectionConfigLabel = {
	singular: string;
	plural: string;
	gender: 'f' | 'm';
};

type BaseDocConfig = {
	slug: string;
	group?: string;
	fields: FieldBuilder<AnyField>[];
	icon?: ComponentType;
	access?: Access;
	url?: <T extends GenericDoc>(doc: T) => string;
	live?: boolean;
};

export type DocumentStatus = { value: string; color: string };

export type BaseCollectionConfig = {
	label?: CollectionConfigLabel;
	auth?: true;
	upload?: boolean;
	hooks?: CollectionHooks;
	status?: boolean | DocumentStatus[];
} & BaseDocConfig;

export type CollectionConfig = BaseCollectionConfig &
	(
		| { upload?: false | undefined }
		| {
				upload: true;
				imageSizes?: ImageSizesConfig[];
				accept?: string[];
				out?: 'jpeg' | 'webp';
		  }
	);

export type GlobalConfig = BaseDocConfig & {
	hooks?: GlobalHooks;
	label?: string;
};

export type DocConfig = CollectionConfig | GlobalConfig;

// Built versions of configs
export type BuiltDocConfig = BuiltCollectionConfig | BuiltGlobalConfig;

export type BuiltConfig = {
	database: string;
	siteUrl?: string;
	collections: BuiltCollectionConfig[];
	globals: BuiltGlobalConfig[];
	localization?: LocalizationConfig;
	icons: Record<string, any>;
	trustedOrigins: string[];
	routes?: Record<string, RouteConfig>;
	plugins?: Record<string, Record<string, MaybeAsyncFunction>>;
	panel: {
		routes: Record<string, CustomPanelRoute>;
		access: (user?: User) => boolean;
		components?: {
			header: ComponentType[];
			// dashboard: ComponentType;
		};
		language: 'fr' | 'en';
	};
};

export type BrowserConfig = Omit<CompiledConfig, 'panel' | 'cors' | 'routes'> & {
	blueprints: Record<FieldsType, FieldsComponents>;
	panel: {
		language: 'fr' | 'en';
		components: { header: ComponentType[]; dashboard?: ComponentType };
	};
};

export type CustomPanelRoute = {
	group?: string;
	label: string;
	icon?: ComponentType;
	component: ComponentType;
};

export type BuiltCollectionConfig = Omit<CollectionConfig, 'status'> & {
	type: 'collection';
	label: CollectionConfigLabel;
	slug: GetRegisterType<'CollectionSlug'>;
	asTitle: string;
	status?: DocumentStatus[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type BuiltGlobalConfig = GlobalConfig & {
	type: 'global';
	label: string;
	slug: GetRegisterType<'GlobalSlug'>;
	asTitle: string;
	fields: FieldBuilder<AnyField>[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type ImageSizesConfig = {
	name: string;
	out?: Array<'jpg' | 'webp'>;
	compression?: number;
} & AtLeastOne<{
	width: number;
	height: number;
}>;

type CompiledCollectionConfig = WithoutBuilders<BuiltCollectionConfig>;
type CompiledGlobalConfig = WithoutBuilders<BuiltGlobalConfig>;
type CompiledConfig = Omit<WithoutBuilders<BuiltConfig>, 'collections'> & {
	collections: Array<CompiledCollectionConfig>;
	globals: Array<CompiledGlobalConfig>;
};
