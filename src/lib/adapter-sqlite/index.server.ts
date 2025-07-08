import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import createAdapterCollectionInterface, { type AdapterCollectionInterface } from './collection.js';
import createAdapterAreaInterface, { type AdapterAreaInterface } from './area.js';
import createAdapterBlocksInterface, { type AdapterBlocksInterface } from './blocks.js';
import createAdapterRelationsInterface, { type AdapterRelationsInterface } from './relations.js';
import createAdapterAuthInterface from './auth/index.server.js';
import { databaseTransformInterface, type AdapterTransformInterface } from './transform.js';
import createAdapterTreeInterface, { type AdapterTreeInterface } from './tree.js';
import { updateTableRecord } from './util.js';
import { updateDocumentUrl } from './url.server.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';
import type { GetRegisterType } from 'rizom';
import type { Dic } from '$lib/util/types.js';
import type { GenericTable } from './types.js';

type Schema = GetRegisterType<'Schema'>;
type Tables = GetRegisterType<'Tables'>;

type CreateAdapterArgs = {
	schema: { tables: Tables; default: Schema; relationFieldsMap: any };
	configInterface: ConfigInterface;
};

const createAdapter = ({ schema, configInterface }: CreateAdapterArgs) => {
	const dbPath = path.join(process.cwd(), 'db', configInterface.raw.database);
	const sqlite = new Database(dbPath);

	const db: BetterSQLite3Database<Schema> = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;

	const blocks: AdapterBlocksInterface = createAdapterBlocksInterface({ db, tables });
	const tree: AdapterTreeInterface = createAdapterTreeInterface({ db, tables });
	const relations: AdapterRelationsInterface = createAdapterRelationsInterface({ db, tables });
	const auth = createAdapterAuthInterface({
		db,
		schema: schema.default,
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
		tables: tables as GetRegisterType<'Tables'>,

		getTable<T extends any = any>(key: string) {
			return tables[key as keyof typeof tables] as T extends any ? GenericTable : T;
		},

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
