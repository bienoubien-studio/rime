import type { Rizom } from '$lib/core/rizom.server.js';
import type { CompiledArea, CompiledCollection } from '.';
import type { GenericDoc, Prototype } from '../../types/doc.js';
import type { DeepPartial, Dic, Pretty } from '$lib/util/types';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

/**
 * Maps prototype to its corresponding config type
 */
type ConfigTypeMap = {
  'collection': CompiledCollection;
  'area': CompiledArea;
};

/**
 * Base hook context with prototype parameter
 */
type HookContext<P extends Prototype> = {
  rizom: Rizom;
  event: Pretty<RequestEvent & { locals: App.Locals }>;
  config: Pretty<ConfigTypeMap[P]>;
  /** Object that can be used to pass data from one hook to another */
  metas: Pretty<Dic>;
};

// Shared hooks for operations supported by both collections and areas
/**
 * Hook executed before reading a document
 */
type HookBeforeRead<P extends Prototype, T> = (
  args: Pretty<
    HookContext<P> & {
      operation: 'read';
      doc: T;
    }
  >
) => Promise<
  HookContext<P> & {
    operation: 'read';
    doc: T;
  }
>;

/**
 * Hook executed before updating a document
 */
type HookBeforeUpdate<P extends Prototype, T> = (
  args: Pretty<
    HookContext<P> & {
      operation: 'update';
      data: DeepPartial<T>;
      originalDoc: T;
    }
  >
) => Promise<
  HookContext<P> & {
    operation: 'update';
    data: DeepPartial<T>;
    originalDoc: T;
  }
>;

/**
 * Hook executed after updating a document
 */
type HookAfterUpdate<P extends Prototype, T> = (
  args: Pretty<
    HookContext<P> & {
      operation: 'update';
      doc: T;
    }
  >
) => Promise<
  HookContext<P> & {
    operation: 'update';
    doc: T;
  }
>;

// Collection-only hooks
/**
 * Hook executed before creating a document (collection only)
 */
type HookBeforeCreate<T> = (
  args: Pretty<
    HookContext<'collection'> & {
      operation: 'create';
      data: DeepPartial<T>;
    }
  >
) => Promise<
  HookContext<'collection'> & {
    operation: 'create';
    data: DeepPartial<T>;
  }
>;

/**
 * Hook executed after creating a document (collection only)
 */
type HookAfterCreate<T> = (
  args: Pretty<
    HookContext<'collection'> & {
      operation: 'create';
      doc: T;
    }
  >
) => Promise<
  HookContext<'collection'> & {
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
type HookBeforeUpsert<P extends Prototype, T> = (
  args: Pretty<
    P extends 'collection'
    ? HookContext<P> & ({
      operation: 'create';
      data: DeepPartial<T>;
    } | {
      operation: 'update';
      data: DeepPartial<T>;
      originalDoc: T
    })
    : HookContext<P> & {
      operation: 'update';
      data: DeepPartial<T>;
      originalDoc: T;
    }
  >
) => Promise<
  P extends 'collection'
  ? HookContext<P> & ({
    operation: 'create';
    data: DeepPartial<T>;
  } | {
    operation: 'update';
    data: DeepPartial<T>;
    originalDoc: T
  })
  : HookContext<P> & {
    operation: 'update';
    data: DeepPartial<T>;
    originalDoc: T;
  }
>;

/**
 * Hook executed after upserting a document (collection only)
 */
type HookAfterUpsert<T> = (
  args: Pretty<HookContext<'collection'> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>
) => Promise<HookContext<'collection'> & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>;

/**
 * Hook executed before deleting a document (collection only)
 */
type HookBeforeDelete<T> = (
  args: Pretty<
    HookContext<'collection'> & {
      operation: 'delete';
      doc: T;
    }
  >
) => Promise<
  HookContext<'collection'> & {
    operation: 'delete';
    doc: T;
  }
>;

/**
 * Hook executed after deleting a document (collection only)
 */
type HookAfterDelete<T> = (
  args: HookContext<'collection'> & {
    operation: 'delete';
    doc: T;
  }
) => Promise<
  HookContext<'collection'> & {
    operation: 'delete';
    doc: T;
  }
>;

// Hook collections
type CollectionHooks<T> = Pretty<{
  beforeCreate?: (HookBeforeCreate | HookBeforeUpsert)[];
  afterCreate?: (HookAfterCreate | HookAfterUpsert)[];
  beforeUpdate?: (HookBeforeUpdate | HookBeforeUpsert)[];
  afterUpdate?: (HookAfterUpdate | HookAfterUpsert<T>)[];
  beforeRead?: HookBeforeRead[];
  beforeDelete?: HookBeforeDelete<T>[];
  afterDelete?: HookAfterDelete<T>[];
}>;

type AreaHooks<T> = {
  beforeRead?: HookBeforeRead[];
  beforeUpdate?: (HookBeforeUpdate | HookBeforeUpsert)[];
  afterUpdate?: HookAfterUpdate[];
};

export type {
  // Hook context
  HookContext,

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
