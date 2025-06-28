import createAdapterCollectionInterface, { type AdapterCollectionInterface } from './collection.js';
import createAdapterAreaInterface, { type AdapterAreaInterface } from './area.js';
import createAdapterBlocksInterface, { type AdapterBlocksInterface } from './blocks.js';
import createAdapterRelationsInterface, { type AdapterRelationsInterface } from './relations.js';
import createAdapterAuthInterface from './auth.server.js';
import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { databaseTransformInterface, type AdapterTransformInterface } from './transform.js';
import createAdapterTreeInterface, { type AdapterTreeInterface } from './tree.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';
import type { Schema } from '$lib/server/schema.js';
import { updateTableRecord } from './util.js';
import type { Dic } from '$lib/util/types.js';
import { updateDocumentUrl } from './url.server.js';

type CreateAdapterArgs = {
	schema: any;
	configInterface: ConfigInterface;
};

const createAdapter = ({ schema, configInterface }: CreateAdapterArgs) => {
	const sqlite = new Database(`./db/${configInterface.raw.database}`);

	const db: BetterSQLite3Database<Schema> = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;

	const blocks: AdapterBlocksInterface = createAdapterBlocksInterface({ db, tables });
	const tree: AdapterTreeInterface = createAdapterTreeInterface({ db, tables });
	const relations: AdapterRelationsInterface = createAdapterRelationsInterface({ db, tables });
	const auth = createAdapterAuthInterface({
		db,
		schema,
		configInterface
	});
	const collection: AdapterCollectionInterface = createAdapterCollectionInterface({
		db,
		tables,
		configInterface
	});
	const area: AdapterAreaInterface = createAdapterAreaInterface({
		db,
		tables,
		configInterface
	});
	const transform: AdapterTransformInterface = databaseTransformInterface({
		tables,
		configInterface
	});
	
	return {
		collection,
		area,
		blocks,
		tree,
		relations,
		transform,
		auth,
		db,
		tables,

		async updateRecord(id: string, tableName: string, data: Dic) {
			return await updateTableRecord(db, tables, tableName, { recordId: id, data });
		},

		async updateDocumentUrl(url: string, params: Omit<Parameters<typeof updateDocumentUrl>[1], 'db' | 'tables'>) {
			
			return await updateDocumentUrl(url, {
				...params,
				db,
				tables
			});
		},

		get schema() {
			return schema.default;
		},

		get relationFieldsMap() {
			return schema.relationFieldsMap;
		}
	};
};

export default createAdapter;

export type Adapter = ReturnType<typeof createAdapter>;
