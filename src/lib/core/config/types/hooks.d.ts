import type { Rizom } from '$lib/core/rizom.server.js';
import type { Rizom } from '$lib/core/cms.server';
import type { CompiledArea, CompiledCollection } from '.';
import type { GenericDoc } from '../../..';
import type { DeepPartial, Dic, Pretty } from '$lib/util/types';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

type HookContext = {
	rizom: Pretty<Rizom>;
	event: Pretty<RequestEvent & { locals: App.Locals }>;
	config: Pretty<CompiledCollection>;
	/** object that can be used to pass data from a hook to an other */
	metas: Pretty<Dic>;
};

// Collection Hooks
type CollectionHookBeforeCreate<T extends GenericDoc = GenericDoc> = (
	args: HookContext & {
		operation: 'create';
		data: DeepPartial<T>;
	}
) => Promise<
	HookContext & {
		operation: 'create';
		data: DeepPartial<T>;
	}
>;

type CollectionHookAfterCreate<T extends GenericDoc = GenericDoc> = (
	args: HookContext & {
		operation: 'create';
		doc: T;
	}
) => Promise<
	HookContext & {
		operation: 'create';
		doc: T;
	}
>;

type CollectionHookBeforeUpdate<T extends GenericDoc = GenericDoc> = (
	args: HookContext & {
		operation: 'update';
		data: DeepPartial<T>;
		originalDoc: T;
	}
) => Promise<
	HookContext & {
		operation: 'update';
		data: DeepPartial<T>;
		originalDoc: T;
	}
>;

type CollectionHookAfterUpdate<T extends GenericDoc = GenericDoc> = (
	args: Pretty<
		HookContext & {
			operation: 'update';
			doc: T;
		}
	>
) => Promise<
	HookContext & {
		operation: 'update';
		doc: T;
	}
>;

type CollectionHookBeforeUpsert<T extends GenericDoc = GenericDoc> = (
	args: Pretty<
		HookContext &
			({ operation: 'create'; data: DeepPartial<T> } | { operation: 'update'; data: DeepPartial<T>; originalDoc: T })
	>
) => Promise<
	HookContext &
		({ operation: 'create'; data: DeepPartial<T> } | { operation: 'update'; data: DeepPartial<T>; originalDoc: T })
>;

type CollectionHookAfterUpsert<T extends GenericDoc = GenericDoc> = (
	args: Pretty<HookContext & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>
) => Promise<HookContext & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>;

type CollectionHookBeforeRead<T extends GenericDoc = GenericDoc> = (
	args: Pretty<
		HookContext & {
			operation: 'read';
			doc: T;
		}
	>
) => Promise<
	HookContext & {
		operation: 'read';
		doc: T;
	}
>;

type CollectionHookBeforeDelete<T extends GenericDoc = GenericDoc> = (
	args: Pretty<
		HookContext & {
			operation: 'delete';
			doc: T;
		}
	>
) => Promise<
	HookContext & {
		operation: 'delete';
		doc: T;
	}
>;

type CollectionHookAfterDelete<T extends GenericDoc = GenericDoc> = (
	args: HookContext & {
		operation: 'delete';
		doc: T;
	}
) => Promise<
	HookContext & {
		operation: 'delete';
		doc: T;
	}
>;

type CollectionHooks<T extends GenericDoc = GenericDoc> = {
	beforeCreate?: (CollectionHookBeforeCreate<T> | CollectionHookBeforeUpsert<T>)[];
	afterCreate?: (CollectionHookAfterCreate<T> | CollectionHookAfterUpsert<T>)[];
	beforeUpdate?: (CollectionHookBeforeUpdate<T> | CollectionHookBeforeUpsert<T>)[];
	afterUpdate?: (CollectionHookAfterUpdate<T> | CollectionHookAfterUpsert<T>)[];
	beforeRead?: CollectionHookBeforeRead<T>[];
	beforeDelete?: CollectionHookBeforeDelete<T>[];
	afterDelete?: CollectionHookAfterDelete<T>[];
};

// Area Hooks
type AreaHookContext = Omit<HookContext, 'config'> & {
	config: CompiledArea;
};

type AreaHookBeforeRead<T extends GenericDoc = GenericDoc> = (
	args: AreaHookContext & {
		operation: 'read';
		doc: T;
	}
) => Promise<
	AreaHookContext & {
		operation: 'read';
		doc: T;
	}
>;

type AreaHookBeforeUpdate<T extends GenericDoc = GenericDoc> = (
	args: AreaHookContext & {
		operation: 'update';
		data: DeepPartial<T>;
		originalDoc: T;
	}
) => Promise<
	AreaHookContext & {
		operation: 'update';
		data: DeepPartial<T>;
		originalDoc: T;
	}
>;

type AreaHookAfterUpdate<T extends GenericDoc = GenericDoc> = (
	args: AreaHookContext & {
		operation: 'update';
		doc: T;
	}
) => Promise<
	AreaHookContext & {
		operation: 'update';
		doc: T;
	}
>;

type AreaHooks<T extends GenericDoc = GenericDoc> = {
	beforeRead?: AreaHookBeforeRead<T>[];
	beforeUpdate?: AreaHookBeforeUpdate<T>[];
	afterUpdate?: AreaHookAfterUpdate<T>[];
};

export type {
	CollectionHooks,
	AreaHooks,
	// Collection hooks
	CollectionHookBeforeCreate,
	CollectionHookAfterCreate,
	CollectionHookBeforeUpdate,
	CollectionHookAfterUpdate,
	CollectionHookBeforeUpsert,
	CollectionHookAfterUpsert,
	CollectionHookBeforeRead,
	CollectionHookBeforeDelete,
	CollectionHookAfterDelete,
	// Area hooks
	AreaHookBeforeRead,
	AreaHookBeforeUpdate,
	AreaHookAfterUpdate
};
