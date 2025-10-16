import type { Config } from '$lib/core/config/types.js';
import { OUTPUT_DIR } from '$lib/core/dev/constants.js';
import type { IConfig } from '$lib/core/rime.server.js';
import type { GetRegisterType } from '$lib/index.js';
import type { Dic } from '$lib/util/types.js';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import path from 'path';
import createAreaInterface from './area.js';
import createAuthInterface from './auth.server.js';
import createBlocksInterface from './blocks.js';
import createCollectionInterface from './collection.js';
import generateSchema from './generate-schema/index.server.js';
import type { RelationFieldsMap } from './generate-schema/relations/definition.server.js';
import createRelationsInterface from './relations.js';
import { databaseTransformInterface } from './transform.js';
import createTreeInterface from './tree.js';
import type { GenericTable } from './types.js';
import { updateDocumentUrl } from './url.server.js';
import { updateTableRecord } from './util.js';

type Schema = GetRegisterType<'Schema'>;
type Tables = GetRegisterType<'Tables'>;

export function adapterSqlite(database: string): {
	createAdapter: <C extends Config>(iConfig: IConfig<C>) => Promise<Adapter>;
	generateSchema: typeof generateSchema;
} {
	//
	return {
		createAdapter: <C extends Config>(iConfig: IConfig<C>) => createAdapter({ database, iConfig }),
		generateSchema
	};
}

const createAdapter = async <const C extends Config>(args: {
	database: string;
	iConfig: IConfig<C>;
}) => {
	const { database, iConfig } = args;

	const schema = (await import(
		path.resolve(/* @vite-ignore */ process.cwd(), `src/lib/${OUTPUT_DIR}/schema.server.js`)
	)) as { tables: Tables; default: Schema; relationFieldsMap: any };

	const dbPath = path.join(process.cwd(), 'db', database);
	// const sqlite = new Database(dbPath);

	const db = drizzle('file:' + dbPath, { schema: schema.default });
	const tables = schema.tables;

	const blocks = createBlocksInterface({ db, tables });
	const tree = createTreeInterface({ db, tables });
	const relations = createRelationsInterface({ db, tables });
	const auth = createAuthInterface({
		db,
		schema: schema.default
	});
	const collection = createCollectionInterface({
		db,
		tables,
		iConfig
	});

	const area = createAreaInterface({
		db,
		tables,
		iConfig
	});

	const transform = databaseTransformInterface({
		tables,
		iConfig
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

		getTable<T>(key: string) {
			return tables[key as keyof typeof tables] as T extends any ? GenericTable : T;
		},

		async updateRecord(id: string, tableName: string, data: Dic) {
			return await updateTableRecord(db, tables, tableName, { recordId: id, data });
		},

		async updateDocumentUrl(
			url: string,
			params: Omit<Parameters<typeof updateDocumentUrl>[1], 'db' | 'tables'>
		) {
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

export type Adapter = {
	collection: ReturnType<typeof createCollectionInterface>;
	area: ReturnType<typeof createAreaInterface>;
	blocks: ReturnType<typeof createBlocksInterface>;
	tree: ReturnType<typeof createTreeInterface>;
	relations: ReturnType<typeof createRelationsInterface>;
	transform: ReturnType<typeof databaseTransformInterface>;
	auth: ReturnType<typeof createAuthInterface>;
	db: LibSQLDatabase<Schema>;
	tables: GetRegisterType<'Tables'>;
	getTable<T>(key: string): T extends any ? GenericTable : T;
	updateRecord(id: string, tableName: string, data: Dic): Awaited<ReturnType<typeof updateTableRecord>>;
	updateDocumentUrl: typeof updateDocumentUrl;
	readonly schema: Schema;
	readonly relationFieldsMap: RelationFieldsMap;
};
