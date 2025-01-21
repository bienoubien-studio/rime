import type { LocalAPI } from 'rizom/types/api.js';
import type { Rizom } from 'rizom/rizom.server';
import type { GenericDoc } from '.';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

type BaseHookArgs = {
	api: LocalAPI;
	rizom: Rizom;
	event?: RequestEvent & {
		locals: App.Locals;
	};
};

type BaseCollectionHookArgs = BaseHookArgs & {
	config: BuiltCollectionConfig;
	operation: 'update' | 'create' | 'read' | 'delete';
};

export type CollectionHookArgs<T extends GenericDoc = GenericDoc> = BaseCollectionHookArgs &
	(
		| { operation: 'create'; data: Partial<T>; doc?: never; originalDoc?: never }
		| { operation: 'create'; data: Partial<T>; doc: T; originalDoc?: never }
		| { operation: 'update'; data: Partial<T>; originalDoc: T; doc?: never }
		| { operation: 'read'; doc: T; data?: never; originalDoc?: never }
		| { operation: 'delete'; doc: T; data?: never; originalDoc?: never }
	);

export type CollectionHookBeforeUpsertArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		data: Partial<T>;
		operation: 'create' | 'update';
	};

export type CollectionHookBeforeCreateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		data: Partial<T>;
		operation: 'create';
	};

export type CollectionHookAfterCreateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		data: Partial<T>;
		doc: T;
		operation: 'create';
	};

export type CollectionHookBeforeUpdateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	};

export type CollectionHookBeforeReadArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'read';
		doc: T;
	};

export type CollectionHookBeforeDeleteArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'delete';
		doc: T;
	};

export type CollectionHookAfterDeleteArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'delete';
		doc: T;
	};

type HookFunction<TArgs> = (args: TArgs) => Promise<TArgs>;

export type CollectionHook<T extends GenericDoc = GenericDoc> = HookFunction<CollectionHookArgs<T>>;

export type CollectionHookBeforeCreate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeCreateArgs<T>
>;

export type CollectionHookAfterCreate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterCreateArgs<T>
>;

export type CollectionHookBeforeRead<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeReadArgs<T>
>;

export type CollectionHookBeforeUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeUpdateArgs<T>
>;

export type CollectionHookBeforeDelete<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeDeleteArgs<T>
>;

export type CollectionHookAfterDelete<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterDeleteArgs<T>
>;

export type CollectionHookBeforeUpsert<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeUpsertArgs<T>
>;

export type CollectionHooks = {
	beforeCreate?: (CollectionHookBeforeCreate | CollectionHookBeforeUpsert | CollectionHook)[];
	afterCreate?: (CollectionHookAfterCreate | CollectionHook)[];
	beforeUpdate?: (CollectionHookBeforeUpdate | CollectionHookBeforeUpsert | CollectionHook)[];
	beforeRead?: (CollectionHookBeforeRead | CollectionHook)[];
	beforeDelete?: (CollectionHookBeforeDelete | CollectionHook)[];
	afterDelete?: (CollectionHookAfterDelete | CollectionHook)[];
};

//////////////////////////////////////////////
// Global
//////////////////////////////////////////////

type BaseGlobalHookArgs = BaseHookArgs & {
	config: BuiltGlobalConfig;
	operation: 'update' | 'read';
};

export type GlobalHookBeforeReadArgs<T extends GenericDoc = GenericDoc> = BaseGlobalHookArgs & {
	doc: T;
	operation: 'read';
};

export type GlobalHookBeforeUpdateArgs<T extends GenericDoc = GenericDoc> = BaseGlobalHookArgs & {
	data: Partial<T>;
	originalDoc: T;
	operation: 'update';
};

export type GlobalHookBeforeRead<T extends GenericDoc = GenericDoc> = HookFunction<
	GlobalHookBeforeReadArgs<T>
>;

export type GlobalHookBeforeUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	GlobalHookBeforeUpdateArgs<T>
>;

export type GlobalHooks = {
	beforeRead?: GlobalHookBeforeRead[];
	beforeUpdate?: GlobalHookBeforeUpdate[];
};
