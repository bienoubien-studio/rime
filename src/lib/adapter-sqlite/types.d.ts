import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export type { Adapter } from './index.server.js';
export type { AdapterBlocksInterface } from './blocks.js';
export type { AdapterCollectionInterface } from './collection.js';
export type { AdapterAreaInterface } from './area.js';
export type { AdapterRelationsInterface } from './relations.js';
export type { AdapterTransformInterface } from './transform.js';

export type GenericAdapterInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
};
