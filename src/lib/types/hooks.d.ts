import type { LocalAPI } from 'rizom/types/api.js';
import type { Rizom } from 'rizom/rizom.server';
import type { CompiledArea, CompiledCollection } from './config';
import type { GenericDoc } from '.';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

type HookContext = {
	api: LocalAPI;
	rizom: Rizom;
	event: RequestEvent & { locals: App.Locals };
	config: CompiledCollection;
};

// Collection Hooks
type CollectionHookBeforeCreate<T extends GenericDoc> = (
	args: HookContext & {
		operation: 'create';
		data: Partial<T>;
	}
) => Promise<
	HookContext & {
		operation: 'create';
		data: Partial<T>;
	}
>;

type CollectionHookAfterCreate<T extends GenericDoc> = (
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

type CollectionHookBeforeUpdate<T extends GenericDoc> = (
	args: HookContext & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	}
) => Promise<
	HookContext & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	}
>;

type CollectionHookAfterUpdate<T extends GenericDoc> = (
	args: HookContext & {
		operation: 'update';
		doc: T;
	}
) => Promise<
	HookContext & {
		operation: 'update';
		doc: T;
	}
>;

type CollectionHookBeforeUpsert<T extends GenericDoc> = (
	args: HookContext &
		(
			| { operation: 'create'; data: Partial<T> }
			| { operation: 'update'; data: Partial<T>; originalDoc: T }
		)
) => Promise<
	HookContext &
		(
			| { operation: 'create'; data: Partial<T> }
			| { operation: 'update'; data: Partial<T>; originalDoc: T }
		)
>;

type CollectionHookAfterUpsert<T extends GenericDoc> = (
	args: HookContext & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })
) => Promise<HookContext & ({ operation: 'create'; doc: T } | { operation: 'update'; doc: T })>;

type CollectionHookBeforeRead<T extends GenericDoc> = (
	args: HookContext & {
		operation: 'read';
		doc: T;
	}
) => Promise<
	HookContext & {
		operation: 'read';
		doc: T;
	}
>;

type CollectionHookBeforeDelete<T extends GenericDoc> = (
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

type CollectionHookAfterDelete<T extends GenericDoc> = (
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

type CollectionHooks<T extends GenericDoc> = {
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

type AreaHookBeforeRead<T extends GenericDoc> = (
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

type AreaHookBeforeUpdate<T extends GenericDoc> = (
	args: AreaHookContext & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	}
) => Promise<
	AreaHookContext & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	}
>;

type AreaHookAfterUpdate<T extends GenericDoc> = (
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

type AreaHooks<T extends GenericDoc> = {
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
