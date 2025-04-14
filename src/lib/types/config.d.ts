import type { RequestHandler } from '@sveltejs/kit';
import type { Access, User } from './auth.js';
import type { AnyField, Field, FieldsType, Option } from './fields.js';
import type { AreaSlug, CollectionSlug, GenericDoc } from './doc.js';
import type { CollectionHooks, AreaHooks } from './hooks.js';
import type { ComponentType } from 'svelte.js';
import type { AtLeastOne, WithoutBuilders, WithRequired } from './util.js';
import type { BaseDoc, GetRegisterType, RegisterArea } from 'rizom';
import type { FieldBuilder } from 'rizom/fields/builders/field.js';
import type { FieldsComponents } from './panel.js';
import type { PanelLanguage } from 'rizom/panel/i18n/index.js';
import type { RegisterCollection } from 'rizom';
import type { SMTPConfig } from 'rizom/plugins/mailer/types.js';
import type { Plugin } from 'rizom/plugins/index.js';
import type { IconProps } from '@lucide/svelte';

export type DocumentPrototype = 'collection' | 'area';

export interface Config {
	/** The database name inside ./db folder */
	database: string;
	/** If config.siteUrl is defined, a preview button is added
	on the panel dahsboard, pointing to this url  */
	siteUrl?: string;
	/** List of Collection  */
	collections: Collection[];
	/** List of Area  */
	areas: Area[];
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
		navigation?: NavigationConfig;
		components?: {
			header?: ComponentType[];
			dashboard?: ComponentType;
		};
	};
	cache?: { isEnabled?: (event: RequestEvent) => boolean };
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
	label?: CollectionLabel;
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

type CollectionLabel = {
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

export type BaseCollection<S> = {
	slug: S;
	label?: CollectionLabel;
	auth?: true;
	hooks?: CollectionHooks<RegisterCollection[S]>;
	url?: (doc: RegisterCollection[S]) => string;
	status?: boolean | DocumentStatus[];
	nested?: boolean;
} & BaseDocConfig;

export type Collection<S> = BaseCollection<S> &
	(
		| { upload?: false | undefined }
		| {
				upload: true;
				/**
				 * Define image sizes that will be generated when an image is uploaded.
				 * A 'thumbnail' size will be added, if none provided with this name.
				 * @example
				 * ```typescript
				 * imageSizes: [
				 *   {
				 *     name: 'thumbnail',
				 *     width: 200,
				 *     height: 200,
				 *     out: ['jpg', 'webp'],
				 *     compression: 80
				 *   },
				 *   {
				 *     name: 'medium',
				 *     width: 800,
				 *     compression: 85
				 *   }
				 * ]
				 * ```
				 */
				imageSizes?: ImageSizesConfig[];
				/**
				 * Allowed mimeTypes
				 * @example
				 * ```typescript
				 * accept: ['image/jpeg', 'image/svg']
				 * ```
				 */
				accept?: string[];
		  }
	);

export type Area<S> = BaseDocConfig & {
	url?: (doc: RegisterArea[S]) => string;
	hooks?: AreaHooks<RegisterArea[S]>;
	label?: string;
};

export type DocConfig = Collection | Area;

// Built versions of configs
export type BuiltDocConfig = BuiltCollection | BuiltArea;

export type BuiltConfig = {
	database: string;
	siteUrl?: string;
	collections: BuiltCollection[];
	areas: BuiltArea[];
	localization?: LocalizationConfig;
	icons: Record<string, any>;
	trustedOrigins: string[];
	routes?: Record<string, RouteConfig>;
	plugins?: Record<string, Plugin['actions']>;
	panel: {
		routes: Record<string, CustomPanelRoute>;
		navigation: NavigationConfig;
		access: (user?: User) => boolean;
		components?: {
			header: ComponentType[];
			collectionHeader: ComponentType[];
			// dashboard: ComponentType;
		};
		language: 'fr' | 'en';
	};
};

export type BrowserConfig = Omit<CompiledConfig, 'panel' | 'cors' | 'routes' | 'smtp'> & {
	blueprints: Record<FieldsType, FieldsComponents>;
	panel: {
		language: 'fr' | 'en';
		navigation: NavigationConfig;
		components: {
			header: ComponentType[];
			dashboard?: ComponentType;
			collectionHeader: ComponentType[];
		};
	};
};

type NavigationConfig = { groups: Array<{ label: string; icon: Component<IconProps> }> };

export type CustomPanelRoute = {
	group?: string;
	label: string;
	icon?: ComponentType;
	component: ComponentType;
};

export type BuiltCollection = Omit<Collection<CollectionSlug>, 'status'> & {
	type: 'collection';
	label: CollectionLabel;
	slug: CollectionSlug;
	asTitle: string;
	status?: DocumentStatus[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type BuiltArea = Area<AreaSlug> & {
	type: 'area';
	label: string;
	slug: AreaSlug;
	asTitle: string;
	fields: FieldBuilder<Field>[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type ImageSizesConfig = {
	name: string;
	/** If none provide will fallback to original file extesion */
	out?: Array<'jpg' | 'webp'>;
	/** Default compression: 60 */
	compression?: number;
} & AtLeastOne<{
	width: number;
	height: number; 
}>;

type CompiledCollection = WithoutBuilders<BuiltCollection>;
type CompiledArea = WithoutBuilders<BuiltArea>;
type CompiledConfig = Omit<WithoutBuilders<BuiltConfig>, 'collections'> & {
	collections: Array<CompiledCollection>;
	areas: Array<CompiledArea>;
};
