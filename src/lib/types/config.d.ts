import type { RequestHandler } from '@sveltejs/kit';
import type { Access, User } from './auth.js';
import type { AnyField, Field, FieldsType, Option } from './fields.js';
import type { CollectionSlug, GenericDoc } from './doc.js';
import type { CollectionHooks, AreaHooks } from './hooks.js';
import type { ComponentType } from 'svelte.js';
import type { AtLeastOne, WithoutBuilders, WithRequired } from './utility.js';
import type { MaybeAsyncFunction, Plugin } from './plugin.js';
import type { BaseDoc, GetRegisterType, RegisterArea } from 'rizom';
import type { FieldBuilder } from 'rizom/fields/builders/field.js';
import type { FieldsComponents } from './panel.js';
import type { PanelLanguage } from 'rizom/panel/i18n/index.js';
import type { RegisterCollection } from 'rizom';

export type DocumentPrototype = 'collection' | 'area';

export interface Config {
	/** The database name inside ./db folder */
	database: string;
	/** If config.siteUrl is defined, a preview button is added
	on the panel dahsboard, pointing to this url  */
	siteUrl?: string;
	/** List of CollectionConfig  */
	collections: CollectionConfig[];
	/** List of AreaConfig  */
	areas: AreaConfig[];
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
	fields?: FieldBuilder<Field>[];
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

type BaseDocConfig<S extends string = string> = {
	slug: S;
	group?: string;
	fields: FieldBuilder<Field>[];
	icon?: ComponentType;
	access?: Access;
	live?: boolean;
};

export type DocumentStatus = { value: string; color: string };

export type BaseCollectionConfig<S> = {
	slug: S;
	label?: CollectionConfigLabel;
	auth?: true;
	// upload?: boolean;
	hooks?: CollectionHooks<RegisterCollection[S]>;
	url?: (doc: RegisterCollection[S]) => string;
	status?: boolean | DocumentStatus[];
} & BaseDocConfig;

export type CollectionConfig<S> = BaseCollectionConfig<S> &
	(
		| { upload?: false | undefined }
		| {
				upload: true;
				imageSizes?: ImageSizesConfig[];
				accept?: string[];
				out?: 'jpeg' | 'webp';
		  }
	);

export type AreaConfig<S> = BaseDocConfig & {
	url?: (doc: RegisterArea[S]) => string;
	hooks?: AreaHooks;
	label?: string;
};

export type DocConfig = CollectionConfig | AreaConfig;

// Built versions of configs
export type BuiltDocConfig = BuiltCollectionConfig | BuiltAreaConfig;

export type BuiltConfig = {
	database: string;
	siteUrl?: string;
	collections: BuiltCollectionConfig[];
	areas: BuiltAreaConfig[];
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

export type BuiltCollectionConfig = Omit<CollectionConfig<CollectionSlug>, 'status'> & {
	type: 'collection';
	label: CollectionConfigLabel;
	slug: GetRegisterType<'CollectionSlug'>;
	asTitle: string;
	status?: DocumentStatus[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type BuiltAreaConfig = AreaConfig<AreaSlug> & {
	type: 'area';
	label: string;
	slug: GetRegisterType<'AreaSlug'>;
	asTitle: string;
	fields: FieldBuilder<Field>[];
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
type CompiledAreaConfig = WithoutBuilders<BuiltAreaConfig>;
type CompiledConfig = Omit<WithoutBuilders<BuiltConfig>, 'collections'> & {
	collections: Array<CompiledCollectionConfig>;
	areas: Array<CompiledAreaConfig>;
};
