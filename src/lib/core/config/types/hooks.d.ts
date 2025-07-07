import type { Rizom } from '$lib/core/rizom.server.js';
import type { CompiledArea, CompiledCollection } from '.';
import type { GenericDoc, Prototype } from '../../types/doc.js';
import type { DeepPartial, Dic, Pretty } from '$lib/util/types';
import type { VersionOperation } from '$lib/core/collections/versions/operations.js';
import type { OperationQuery } from '$lib/core/types/index.js';
import type { ConfigMap } from '$lib/core/operations/configMap/types.js';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

/**
 * Maps prototype to its corresponding config type
 */
type ConfigTypeMap = {
	collection: CompiledCollection;
	area: CompiledArea;
};

type HookContext = Dic & {
	/** Parameters passed to the original operation method */
	params: {
		id?: string;
		versionId?: string;
		sort?: string;
		locale?: string;
		draft?: boolean;
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
type HookParams<P extends Prototype, T extends Partial<GenericDoc>> = {
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
type HookBeforeOperation<P extends Prototype> = (args: {
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
type HookBeforeRead<P extends Prototype, T extends Partial<GenericDoc>> = (
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
type HookBeforeUpdate<P extends Prototype, T extends Partial<GenericDoc>> = (
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
type HookAfterUpdate<P extends Prototype, T extends Partial<GenericDoc>> = (
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
type HookBeforeCreate<T extends Partial<GenericDoc>> = (
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
type HookAfterCreate<T extends Partial<GenericDoc>> = (
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
type HookBeforeUpsert<P extends Prototype, T extends Partial<GenericDoc>> = (
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
type HookAfterUpsert<T extends Partial<GenericDoc>> = (
	args: Pretty<HookParams<'collection', T> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>
) => Promise<HookParams<'collection', T> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>;

/**
 * Hook executed before deleting a document (collection only)
 */
type HookBeforeDelete<T extends Partial<GenericDoc>> = (
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
type HookAfterDelete<T extends Partial<GenericDoc>> = (
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
type CollectionHooks<T> = {
	beforeOperation?: HookBeforeOperation<any>[];
	beforeCreate?: (HookBeforeCreate<any> | HookBeforeUpsert<any, any>)[];
	afterCreate?: (HookAfterCreate<any> | HookAfterUpsert<any>)[];
	beforeUpdate?: (HookBeforeUpdate<any, any> | HookBeforeUpsert<any, any>)[];
	afterUpdate?: (HookAfterUpdate<any, any> | HookAfterUpsert<any>)[];
	beforeRead?: HookBeforeRead<any, any>[];
	beforeDelete?: HookBeforeDelete<any>[];
	afterDelete?: HookAfterDelete<any>[];
};

type AreaHooks<T> = {
	beforeOperation?: HookBeforeOperation<any>[];
	beforeRead?: HookBeforeRead<any, any>[];
	beforeUpdate?: (HookBeforeUpdate<any, any> | HookBeforeUpsert<any, any>)[];
	afterUpdate?: HookAfterUpdate<any, any>[];
};

export type {
	// Hook context
	HookContext,
	HookBeforeOperation,

	// Generic hooks
	HookBeforeRead,
	HookBeforeUpdate,
	HookAfterUpdate,
	HookBeforeUpsert,

	// Collection-specific hooks
	HookBeforeCreate,
	HookAfterCreate,
	HookAfterUpsert,
	HookBeforeDelete,
	HookAfterDelete,

	// Hook collections
	CollectionHooks,
	AreaHooks
};
