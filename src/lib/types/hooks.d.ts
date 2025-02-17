import type { LocalAPI } from 'rizom/types/api.js';
import type { Rizom } from 'rizom/rizom.server';
import type { BuiltCollectionConfig, GenericDoc } from '.';
import type { CompiledCollectionConfig } from './config';

type RequestEvent = import('@sveltejs/kit').RequestEvent;

type BaseHookArgs = {
	api: LocalAPI;
	rizom: Rizom;
	event: RequestEvent & {
		locals: App.Locals;
	};
};

type BaseCollectionHookArgs = BaseHookArgs & {
	config: CompiledCollectionConfig;
	operation: 'update' | 'create' | 'read' | 'delete';
};

export type CollectionHookArgs<T extends GenericDoc = GenericDoc> = BaseCollectionHookArgs &
	(
		| { operation: 'create'; data: Partial<T>; doc?: never; originalDoc?: never }
		| { operation: 'create'; data?: never; doc: T; originalDoc?: never }
		| { operation: 'update'; data: Partial<T>; originalDoc: T; doc?: never }
		| { operation: 'update'; doc: T; data?: never; originalDoc?: never }
		| { operation: 'read'; doc: T; data?: never; originalDoc?: never }
		| { operation: 'delete'; doc: T; data?: never; originalDoc?: never }
	);

type HookFunction<TArgs> = (args: TArgs) => Promise<TArgs>;
export type CollectionHook<T extends GenericDoc = GenericDoc> = HookFunction<CollectionHookArgs<T>>;

/////////////////////////////////////////////
// UPSERT
//////////////////////////////////////////////
// export type CollectionHookBeforeUpsertArgs<T extends GenericDoc = GenericDoc> =
// 	BaseCollectionHookArgs & {
// 		data: Partial<T>;
// 		operation: 'create' | 'update';
// 	};

// export type CollectionHookAfterUpsertArgs<T extends GenericDoc = GenericDoc> =
// 	BaseCollectionHookArgs & {
// 		doc: Partial<T>;
// 		operation: 'create' | 'update';
// 	};

export type CollectionHookBeforeUpsert<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeUpdateArgs<T> | CollectionHookBeforeCreateArgs<T>
>;
export type CollectionHookAfterUpsert<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterUpdateArgs<T> | CollectionHookAfterCreateArgs<T>
>;

/////////////////////////////////////////////
// CREATE
//////////////////////////////////////////////
export type CollectionHookBeforeCreateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		data: Partial<T>;
		operation: 'create';
	};

export type CollectionHookAfterCreateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		doc: T;
		operation: 'create';
	};

export type CollectionHookBeforeCreate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeCreateArgs<T>
>;

export type CollectionHookAfterCreate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterCreateArgs<T>
>;

/////////////////////////////////////////////
// UPDATE
//////////////////////////////////////////////
export type CollectionHookBeforeUpdateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'update';
		data: Partial<T>;
		originalDoc: T;
	};

export type CollectionHookAfterUpdateArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'update';
		doc: T;
	};

export type CollectionHookBeforeUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeUpdateArgs<T>
>;

export type CollectionHookAfterUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterUpdateArgs<T>
>;

/////////////////////////////////////////////
// READ
//////////////////////////////////////////////
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

export type CollectionHookBeforeRead<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeReadArgs<T>
>;

/////////////////////////////////////////////
// DELETE
//////////////////////////////////////////////
export type CollectionHookAfterDeleteArgs<T extends GenericDoc = GenericDoc> =
	BaseCollectionHookArgs & {
		operation: 'delete';
		doc: T;
	};

export type CollectionHookBeforeDelete<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookBeforeDeleteArgs<T>
>;

export type CollectionHookAfterDelete<T extends GenericDoc = GenericDoc> = HookFunction<
	CollectionHookAfterDeleteArgs<T>
>;

export type CollectionHooks<T extends GenericDoc> = {
	beforeCreate?: (CollectionHookBeforeCreate<T> | CollectionHookBeforeUpsert<T>)[];
	afterCreate?: (CollectionHookAfterCreate<T> | CollectionHookAfterUpsert<T>)[];
	beforeUpdate?: (CollectionHookBeforeUpdate<T> | CollectionHookBeforeUpsert<T>)[];
	afterUpdate?: (CollectionHookAfterUpdate<T> | CollectionHookAfterUpsert<T>)[];
	beforeRead?: CollectionHookBeforeRead<T>[];
	beforeDelete?: CollectionHookBeforeDelete<T>[];
	afterDelete?: CollectionHookAfterDelete<T>[];
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

export type GlobalHookAfterUpdateArgs<T extends GenericDoc = GenericDoc> = BaseGlobalHookArgs & {
	doc: T;
	operation: 'update';
};

export type GlobalHookBeforeRead<T extends GenericDoc = GenericDoc> = HookFunction<
	GlobalHookBeforeReadArgs<T>
>;

export type GlobalHookBeforeUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	GlobalHookBeforeUpdateArgs<T>
>;

export type GlobalHookAfterUpdate<T extends GenericDoc = GenericDoc> = HookFunction<
	GlobalHookAfterUpdateArgs<T>
>;

export type GlobalHooks = {
	beforeRead?: GlobalHookBeforeRead[];
	beforeUpdate?: GlobalHookBeforeUpdate[];
	afterUpdate?: GlobalHookAfterUpdate[];
};
