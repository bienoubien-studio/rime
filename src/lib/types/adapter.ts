import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { GenericDoc, GenericBlock, PrototypeSlug } from 'rizom/types/doc.js';
import type { OperationQuery } from 'rizom/types/api.js';
import type { Relation } from '../db/relations.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';

export interface AdapterCollectionInterface {
	findAll(args: {
		slug: PrototypeSlug;
		sort?: string;
		limit?: number;
		locale?: string;
	}): Promise<GenericDoc[]>;

	findById(args: {
		slug: PrototypeSlug;
		id: string;
		locale?: string;
	}): Promise<GenericDoc | undefined>;

	deleteById(args: { slug: PrototypeSlug; id: string }): Promise<string | undefined>;

	insert(args: {
		slug: PrototypeSlug;
		data: Partial<GenericDoc>;
		locale?: string;
	}): Promise<string>;

	update(args: {
		slug: PrototypeSlug;
		id: string;
		data: Partial<GenericDoc>;
		locale?: string;
	}): Promise<string | undefined>;

	query(args: {
		slug: PrototypeSlug;
		query: OperationQuery;
		sort?: string;
		limit?: number;
		locale?: string;
	}): Promise<GenericDoc[]>;
}

export interface AdapterGlobalInterface {
	get(args: { slug: PrototypeSlug; locale?: string }): Promise<GenericDoc>;

	update(args: {
		slug: PrototypeSlug;
		data: Partial<GenericDoc>;
		locale?: string;
	}): Promise<GenericDoc>;
}

export interface AdapterBlocksInterface {
	getBlocksTableNames(slug: string): string[];

	deleteFromPaths(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		paths: string[];
	}): Promise<GenericBlock[]>;

	deleteBlocks(args: {
		parentSlug: string;
		ids?: string[];
		parentId: string;
	}): Promise<GenericBlock[]>;

	createBlock(args: {
		parentSlug: PrototypeSlug;
		block: GenericBlock;
		parentId: string;
		locale?: string;
	}): Promise<boolean>;
}

export interface AdapterRelationsInterface {
	updateOrCreate(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		relations: Partial<Relation>[];
	}): Promise<boolean>;

	deleteFromPaths(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		paths: string[];
		locale?: string;
	}): Promise<boolean>;
}

export type TransformContext<T = GenericDoc> = {
	doc: T;
	slug: PrototypeSlug;
	locale?: string;
	event?: RequestEvent;
	api: LocalAPI;
	depth?: number;
};
export type TransformManyContext<T = GenericDoc> = Omit<TransformContext<T>, 'doc'> & {
	docs: T[];
};

export interface AdapterTransformInterface {
	doc: <T extends GenericDoc = GenericDoc>(args: TransformContext<T>) => Promise<T>;
	docs: <T extends GenericDoc = GenericDoc>(args: TransformManyContext<T>) => Promise<T[]>;
}

export interface Adapter {
	collection: AdapterCollectionInterface;
	global: AdapterGlobalInterface;
	blocks: AdapterBlocksInterface;
	relations: AdapterRelationsInterface;
	transform: AdapterTransformInterface;
	db: BetterSQLite3Database<any>;
	schema: any;
	tables: any;
	relationFieldsMap: any;
}

export type GenericAdapterInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
};
