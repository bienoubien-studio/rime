import type { RequestEvent, RequestHandler } from '@sveltejs/kit';
import type { Access, User } from '../../collections/auth/types.js';
import type { Field, FieldsType, Option } from '$lib/fields/types.js';
import type { AreaSlug, CollectionSlug, GenericDoc, Prototype } from '../../types/doc.js';
import type { AtLeastOne, DeepPartial, Dic, Pretty, WithoutBuilders, WithRequired } from '$lib/util/types.js';
import type { RegisterArea, RegisterCollection } from '$lib/index.js';
import type { FieldBuilder } from '$lib/fields/builders/field.server.js';
import type { FieldsComponents } from '../../../panel/types.js';
import type { PanelLanguage } from '$lib/core/i18n/index.js';
import type { SMTPConfig } from '$lib/core/plugins/mailer/types.js';
import type { Plugin } from '$lib/core/types/plugins.js';
import type { IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import type { DashboardEntry } from '$lib/panel/pages/dashboard/types.js';
import type { Rizom } from '$lib/core/rizom.server.js';
import type { OperationQuery } from '$lib/core/types/index.js';
import type { VersionOperation } from '$lib/core/collections/versions/operations.js';
import type { ConfigMap } from '$lib/core/operations/configMap/types.js';

export interface Config {
	/** If config.siteUrl is defined, a preview button is added
	on the panel dahsboard, pointing to this url  */
	siteUrl?: string;
	/** Transversal auth config */
	auth?: {
		/** Enable magicLink Better-Auth plugin */
		magicLink?: boolean;
	};
	/** The database name inside ./db folder */
	database: string;
	/** List of Collection  */
	collections: BuiltCollection[];
	/** List of Area  */
	areas: BuiltArea[];
	/** List of locales for document i18£n
	 * @example
	 * localization: {
	 *   locales: [
	 *     {
	 *       code: 'fr',
	 *       label: 'Français'
	 *     },
	 *     {
	 *       code: 'en',
	 *       label: 'English',
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
		/** who can accesss the panel */
		access?: (user: User | undefined) => boolean;
		/** Custom panel routes that render a given component */
		routes?: Record<string, CustomPanelRoute>;
		/** Additional panel users config  */
		users?: PanelUsersConfig;
		/** The panel language, "en" or "fr" supports only */
		language?: PanelLanguage;
		/** Sidebar navigation groups labels and icons */
		navigation?: Pretty<NavigationConfig>;
		/** Specific components */
		components?: {
			/** Dashboard header */
			header?: Component[];
			/** Collection header */
			collectionHeader?: Component[];
			/** Full dashboard component */
			dashboard?: Component<{ entries: DashboardEntry[]; user?: User }>;
		};
		/** a relative path from the "static" directory or an external url
		 * @example
		 * // for static/panel/custom.css
		 * css : '/panel/custom.css'
		 */
		css?: string;
	};
	/** Enable built-in API cache */
	cache?: { isEnabled?: (event: RequestEvent) => boolean };
	/** SMTP config */
	smtp?: SMTPConfig;
	/** Custom API routes
	 * @example
	 * routes: {
	 * 	'/hello' : {
	 * 		GET: (event) => json({ message: 'hello' }),
	 * 		POST: (event) => doSomething(event).then(() => json({ message: 'successfully updated' })),
	 * 	}
	 * }
	 */
	routes?: Record<string, RouteConfig>;
	plugins?: ReturnType<Plugin>[];
	custom?: {
		browser?: Record<string, any>;
		server?: Record<string, any>;
	};
}

export type PanelUsersConfig = {
	roles?: (string | Option)[];
	panel?: {
		group?: string;
	};
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
};

type CollectionLabel = {
	singular: string;
	plural: string;
	gender: 'f' | 'm';
};

export type VersionsConfig = { draft?: boolean; autoSave?: boolean; maxVersions?: number };

type BaseDocConfig<S extends string = string> = {
	slug: S;
	/** Document fields definition */
	fields: FieldBuilder<Field>[];
	/** Optional icon */
	icon?: Component<IconProps>;
	/** Enable document versions */
	versions?: boolean | VersionsConfig;
	access?: Access;
	/** If the document can be edited live, if enabled the url prop must be set also. */
	live?: boolean;
	/** Panel configuration, set false to hide the area/collection from the panel */
	panel?:
		| false
		| {
				/** Description for the collection/area, basically displayed on the dashboard */
				description?: string;
				/** Sidebar navigation group */
				group?: string;
				/** Add the list of latest edited document on the dashboard */
				dashboard?: boolean;
		  };
};

type UploadConfig = {
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
};

type AuthConfig = (
	| {
			type: 'password';
	  }
	| { type: 'apiKey' }
) & {
	isBetterAuthAdmin?: boolean;
	roles?: (string|Option)[];
};

export type Collection<S> = {
	slug: S;
	/** The collection label */
	label?: CollectionLabel;
	auth?: boolean | AuthConfig;
	hooks?: CollectionHooks<RegisterCollection[S]>;
	/** A function to generate the document URL */
	url?: (doc: RegisterCollection[S]) => string;
	nested?: boolean;
	upload?: boolean | UploadConfig;
} & BaseDocConfig;

export type Area<S> = BaseDocConfig & {
	/** A function to generate the document URL */
	url?: (doc: RegisterArea[S]) => string;
	hooks?: AreaHooks<RegisterArea[S]>;
	/** The area label */
	label?: string;
};

export type BuiltConfig = {
	auth?: {
		magicLink?: boolean;
	};
	/** Database location relative to the root project ex: ./db/my-app.sqlite */
	database: string;
	/** The database location */
	siteUrl?: string;
	/** list of collections */
	collections: BuiltCollection[];
	/** list of areas */
	areas: BuiltArea[];
	/** Define wich language the cms support */
	localization?: LocalizationConfig;
	icons: Record<string, any>;
	trustedOrigins: string[];
	routes?: Record<string, RouteConfig>;
	plugins?: Record<string, ReturnType<Plugin>['actions']>;
	panel: {
		routes: Record<string, CustomPanelRoute>;
		navigation: NavigationConfig;
		access: (user?: User) => boolean;
		components?: {
			header: Component[];
			collectionHeader?: Component[];
			dashboard?: Component<{ entries: DashboardEntry[]; user?: User }>;
		};
		css?: string;
		/**
		 * Define the panel language
		 *
		 * If none defined it will try to use the current locale if the translation is available
		 */
		language: 'fr' | 'en';
	};
};

export type BrowserConfig = Omit<CompiledConfig, 'panel' | 'cors' | 'routes' | 'smtp'> & {
	blueprints: Record<FieldsType, FieldsComponents>;
	panel: {
		language: 'fr' | 'en';
		navigation: NavigationConfig;
		components: {
			header: Component[];
			dashboard?: Component<{ entries: DashboardEntry[]; user?: User }>;
			collectionHeader: Component[];
		};
	};
};

type NavigationConfig = { groups: Array<{ label: string; icon: Component<IconProps> }> };

export type CustomPanelRoute = {
	group?: string;
	label: string;
	icon?: Component<IconProps>;
	component: Component;
};

export type BuiltCollection = Omit<Collection<CollectionSlug>, 'versions' | 'upload' | 'auth'> & {
	type: 'collection';
	auth?: AuthConfig;
	label: CollectionLabel;
	slug: CollectionSlug;
	asTitle: string;
	versions?: Required<VersionsConfig>;
	upload?: UploadConfig;
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type BuiltArea = Omit<Area<AreaSlug>, 'versions'> & {
	type: 'area';
	label: string;
	slug: AreaSlug;
	asTitle: string;
	versions?: Required<VersionsConfig>;
	fields: FieldBuilder<Field>[];
	access: WithRequired<Access, 'create' | 'read' | 'update' | 'delete'>;
};

export type ImageSizesConfig = {
	name: string;
	/** If none provided, will fallback to original file extesion */
	out?: Array<'jpg' | 'webp'>;
	/** Default compression: 60 */
	compression?: number;
} & AtLeastOne<{
	width: number;
	height: number;
}>;

export type CompiledCollection = Pretty<WithoutBuilders<BuiltCollection>>;
export type CompiledArea = Pretty<WithoutBuilders<BuiltArea>>;
export type CompiledConfig = Pretty<
	Omit<WithoutBuilders<BuiltConfig>, 'collections'> & {
		collections: Array<CompiledCollection>;
		areas: Array<CompiledArea>;
	}
>;

/****************************************************/
/* Hooks 
/****************************************************/

/**
 * Maps prototype to its corresponding config type
 */
type ConfigTypeMap = {
	collection: CompiledCollection;
	area: CompiledArea;
};

export type HookContext = Dic & {
	/** Parameters passed to the original operation method */
	params: {
		id?: string;
		versionId?: string;
		sort?: string;
		locale?: string;
		offset?: number;
		limit?: number;
		depth?: number;
		select?: string[];
		query?: OperationQuery;
		draft?: boolean
	};
	/** Parameter passed to an update operation when creating locale document fallback */
	isFallbackLocale?: boolean;
	/** Type of version operation */
	versionOperation?: VersionOperation;
	/** The original document if on an update operation */
	originalDoc?: GenericDoc;
	/** An map to get a field config by path on the original doc */
	originalConfigMap?: ConfigMap;
	/** An map to get a field config by path on incoming data */
	configMap?: ConfigMap;
	/** Add super descriptive stuff here */
	isSystemOperation?:boolean
};

/**
 * Base hook context with prototype parameter
 */
export type HookParams<P extends Prototype, T extends Partial<GenericDoc>> = {
	rizom: Rizom;
	event: Pretty<RequestEvent & { locals: App.Locals }>;
	config: Pretty<ConfigTypeMap[P]>;
	/** Object that can be used to pass data from one hook to another */
	context: HookContext;
};

// Shared hooks for operations supported by both collections and areas

/**
 * Hook executed before any operation
 */
export type HookBeforeOperation<P extends Prototype> = (args: {
	rizom: Rizom;
	event: Pretty<RequestEvent & { locals: App.Locals }>;
	config: Pretty<ConfigTypeMap[P]>;
	operation: 'create' | 'read' | 'update' | 'delete';
	context: HookContext;
}) => Promise<{
	rizom: Rizom;
	event: Pretty<RequestEvent & { locals: App.Locals }>;
	config: Pretty<ConfigTypeMap[P]>;
	operation: 'create' | 'read' | 'update' | 'delete';
	context: HookContext;
}>;

/**
 * Hook executed before reading a document
 */
export type HookBeforeRead<P extends Prototype, T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<P, T> & {
			operation: 'read';
			doc: T;
		}
	>
) => Promise<
	HookParams<P, T> & {
		operation: 'read';
		doc: T;
	}
>;

/**
 * Hook executed before updating a document
 */
export type HookBeforeUpdate<P extends Prototype, T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<P, T> & {
			operation: 'update';
			data: DeepPartial<T>;
		}
	>
) => Promise<
	HookParams<P, T> & {
		operation: 'update';
		data: DeepPartial<T>;
	}
>;

/**
 * Hook executed after updating a document
 */
export type HookAfterUpdate<P extends Prototype, T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<P, T> & {
			operation: 'update';
			doc: T;
		}
	>
) => Promise<
	HookParams<P, T> & {
		operation: 'update';
		doc: T;
	}
>;

// Collection-only hooks
/**
 * Hook executed before creating a document (collection only)
 */
export type HookBeforeCreate<T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<'collection', T> & {
			operation: 'create';
			data: DeepPartial<T>;
		}
	>
) => Promise<
	HookParams<'collection', T> & {
		operation: 'create';
		data: DeepPartial<T>;
	}
>;

/**
 * Hook executed after creating a document (collection only)
 */
export type HookAfterCreate<T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<'collection', T> & {
			operation: 'create';
			doc: T;
		}
	>
) => Promise<
	HookParams<'collection', T> & {
		operation: 'create';
		doc: T;
	}
>;

/**
 * Hook executed before upserting a document
 * Works with both collections and areas
 * For collections: handles both create and update operations
 * For areas: handles only update operations
 */
export type HookBeforeUpsert<P extends Prototype, T extends Partial<GenericDoc>> = (
	args: Pretty<
		P extends 'collection'
			? HookParams<P, T> &
					(
						| {
								operation: 'create';
								data: DeepPartial<T>;
						  }
						| {
								operation: 'update';
								data: DeepPartial<T>;
						  }
					)
			: HookParams<P, T> & {
					operation: 'update';
					data: DeepPartial<T>;
				}
	>
) => Promise<
	P extends 'collection'
		? HookParams<P, T> &
				(
					| {
							operation: 'create';
							data: DeepPartial<T>;
					  }
					| {
							operation: 'update';
							data: DeepPartial<T>;
					  }
				)
		: HookParams<P, T> & {
				operation: 'update';
				data: DeepPartial<T>;
			}
>;

/**
 * Hook executed after upserting a document (collection only)
 */
export type HookAfterUpsert<T extends Partial<GenericDoc>> = (
	args: Pretty<HookParams<'collection', T> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>
) => Promise<HookParams<'collection', T> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>;

/**
 * Hook executed before deleting a document (collection only)
 */
export type HookBeforeDelete<T extends Partial<GenericDoc>> = (
	args: Pretty<
		HookParams<'collection', T> & {
			operation: 'delete';
			doc: T;
		}
	>
) => Promise<
	HookParams<'collection', T> & {
		operation: 'delete';
		doc: T;
	}
>;

/**
 * Hook executed after deleting a document (collection only)
 */
export type HookAfterDelete<T extends Partial<GenericDoc>> = (
	args: HookParams<'collection', T> & {
		operation: 'delete';
		doc: T;
	}
) => Promise<
	HookParams<'collection', T> & {
		operation: 'delete';
		doc: T;
	}
>;

// Hook collections
export type CollectionHooks<T> = {
	beforeOperation?: HookBeforeOperation<any>[];
	beforeCreate?: (HookBeforeCreate<any> | HookBeforeUpsert<any, any>)[];
	afterCreate?: (HookAfterCreate<any> | HookAfterUpsert<any>)[];
	beforeUpdate?: (HookBeforeUpdate<any, any> | HookBeforeUpsert<any, any>)[];
	afterUpdate?: (HookAfterUpdate<any, any> | HookAfterUpsert<any>)[];
	beforeRead?: HookBeforeRead<any, any>[];
	beforeDelete?: HookBeforeDelete<any>[];
	afterDelete?: HookAfterDelete<any>[];
};

export type AreaHooks<T> = {
	beforeOperation?: HookBeforeOperation<any>[];
	beforeRead?: HookBeforeRead<any, any>[];
	beforeUpdate?: (HookBeforeUpdate<any, any> | HookBeforeUpsert<any, any>)[];
	afterUpdate?: HookAfterUpdate<any, any>[];
};
