import type { RequestHandler } from '@sveltejs/kit';
import type { Access, User } from './auth';
import type { AnyField } from './fields';
import type { GenericDoc } from './doc';
import type { CollectionHooks, GlobalHooks } from './hooks';
import type { ComponentType } from 'svelte';
import type { AtLeastOne, WithRequired } from './utility';
import type { MaybeAsyncFunction, Plugin } from './plugin';

export type DocumentPrototype = 'collection' | 'global';

export interface Config {
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
	 * cors: ['www.external.com']
	 * ```
	 */
	cors?: string[];
	panel?: {
		access?: (user: User | undefined) => boolean;
		routes?: Record<string, CustomPanelRoute>;
		users?: PanelUsersConfig;
	};
	smtp?: SMTPConfig;
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
	fields?: UserDefinedField[];
};

export type RouteConfig = {
	POST?: RequestHandler;
	GET?: RequestHandler;
	PATCH?: RequestHandler;
	DELETE?: RequestHandler;
};

export type SMTPConfig = {
	from: string | undefined;
	host: string | undefined;
	port: number | undefined;
	auth: {
		user: string | undefined;
		password: string | undefined;
	};
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

type BaseDocConfig = {
	name: string;
	slug: string;
	group?: string;
	fields: UserDefinedField[];
	asTitle?: string;
	label?: string;
	icon?: ComponentType;
	access?: Access;
	url?: <T extends GenericDoc>(doc: T) => string;
	live?: (doc: GenericDoc) => string;
};

export type BaseCollectionConfig = {
	auth?: true;
	upload?: boolean;
	hooks?: CollectionHooks;
} & BaseDocConfig;

export type CollectionConfig = BaseCollectionConfig | UploadCollectionConfig;

export type GlobalConfig = BaseDocConfig & {
	hooks?: GlobalHooks;
};

export type DocConfig = CollectionConfig | GlobalConfig;

// Built versions of configs
export type BuiltDocConfig =
	| BuiltCollectionConfig
	| BuiltUploadCollectionConfig
	| BuiltGlobalConfig;

export type BuiltConfig = {
	siteUrl?: string;
	collections: (BuiltCollectionConfig | BuiltUploadCollectionConfig)[];
	globals: BuiltGlobalConfig[];
	localization?: LocalizationConfig;
	icons: Record<string, any>;
	cors?: string[];
	routes?: Record<string, RouteConfig>;
	plugins?: Record<string, Record<string, MaybeAsyncFunction>>;
	panel: {
		routes: Record<string, CustomPanelRoute>;
		access: (user: User) => boolean;
	};
	smtp?: SMTPConfig;
};

export type BrowserConfig = Omit<BuiltConfig, 'panel' | 'cors' | 'smtp' | 'routes'>;

export type CustomPanelRoute = {
	group?: string;
	label: string;
	icon?: ComponentType;
	component: ComponentType;
};

export type BuiltCollectionConfig = Omit<CollectionConfig, 'fields'> & {
	type: 'collection';
	slug: DocTables;
	asTitle: string;
	fields: AnyField[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type BuiltGlobalConfig = Omit<GlobalConfig, 'fields'> & {
	type: 'global';
	slug: DocTables;
	asTitle: string;
	fields: AnyField[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type UploadCollectionConfig = BaseCollectionConfig & {
	upload: true;
	imageSizes?: ImageSizesConfig[];
	accept: string[];
	panelThumbnail?: string;
};

export type BuiltUploadCollectionConfig = BuiltCollectionConfig & {
	upload: true;
	imageSizes?: ImageSizesConfig[];
	accept: string[];
	panelThumbnail?: string;
};

export type ImageSizesConfig = {
	name: string;
} & AtLeastOne<{
	width: number;
	height: number;
}>;
