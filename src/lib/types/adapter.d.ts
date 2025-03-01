import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { GenericDoc, GenericBlock, PrototypeSlug, TreeBlock } from 'rizom/types/doc.js';
import type { OperationQuery } from 'rizom/types/api.js';
import type { BeforeOperationRelation, Relation } from '../db/relations.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { WithRequired } from './utility.js';

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

export interface AdapterAreaInterface {
	get(args: { slug: PrototypeSlug; locale?: string }): Promise<Partial<GenericDoc>>;

	update(args: {
		slug: PrototypeSlug;
		data: Partial<GenericDoc>;
		locale?: string;
	}): Promise<GenericDoc>;
}

export interface AdapterTreeInterface {
	getBlocksTableNames(slug: string): string[];

	delete(args: { parentSlug: string; block: WithRequired<TreeBlock, 'path'> }): Promise<boolean>;

	update(args: {
		parentSlug: PrototypeSlug;
		block: WithRequired<TreeBlock, 'path'>;
		locale?: string;
	}): Promise<boolean>;

	create(args: {
		parentSlug: PrototypeSlug;
		block: WithRequired<TreeBlock, 'path'>;
		parentId: string;
		locale?: string;
	}): Promise<boolean>;
}

export interface AdapterBlocksInterface {
	getBlocksTableNames(slug: string): string[];

	delete(args: { parentSlug: string; block: GenericBlock }): Promise<boolean>;

	update(args: {
		parentSlug: PrototypeSlug;
		block: GenericBlock;
		locale?: string;
	}): Promise<boolean>;

	create(args: {
		parentSlug: PrototypeSlug;
		block: GenericBlock;
		parentId: string;
		locale?: string;
	}): Promise<boolean>;
}

export interface AdapterRelationsInterface {
	update(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		relations: Relation[];
	}): Promise<boolean>;

	delete(args: { parentSlug: PrototypeSlug; relations: Relation[] }): Promise<boolean>;
	update(args: { parentSlug: PrototypeSlug; relations: Relation[] }): Promise<boolean>;

	create(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		relations: BeforeOperationRelation[];
	}): Promise<boolean>;

	deleteFromPaths(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		paths: string[];
		locale?: string;
	}): Promise<boolean>;

	getAll(args: {
		parentSlug: PrototypeSlug;
		parentId: string;
		locale?: string;
		paths?: string[];
	}): Promise<Relation[]>;
}

export interface AdapterTransformInterface {
	doc: <T extends GenericDoc = GenericDoc>(args: {
		doc: Partial<T>;
		slug: PrototypeSlug;
		locale?: string;
		event: RequestEvent;
		api: LocalAPI;
		depth?: number;
	}) => Promise<Partial<T> & { id: string }>;
}

export interface Adapter {
	collection: AdapterCollectionInterface;
	area: AdapterAreaInterface;
	tree: AdapterTreeInterface;
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
