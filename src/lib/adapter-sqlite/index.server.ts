import createAdapterCollectionInterface, { type AdapterCollectionInterface } from './collection.js';
import createAdapterAreaInterface, { type AdapterAreaInterface } from './area.js';
import createAdapterBlocksInterface, { type AdapterBlocksInterface } from './blocks.js';
import createAdapterRelationsInterface, { type AdapterRelationsInterface } from './relations.js';
import createAdapterAuthInterface from './auth.server.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { databaseTransformInterface, type AdapterTransformInterface } from './transform.js';
import createAdapterTreeInterface, { type AdapterTreeInterface } from './tree.js';
import type { ConfigInterface } from '$lib/core/config/index.server.js';

type CreateAdapterArgs = {
	schema: any;
	configInterface: ConfigInterface;
};

const createAdapter = ({ schema, configInterface }: CreateAdapterArgs) => {
	const sqlite = new Database(`./db/${configInterface.raw.database}`);
	
	const db = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;
	
	const auth = createAdapterAuthInterface({
		db,
		schema,
		configInterface
	});
	const blocks: AdapterBlocksInterface = createAdapterBlocksInterface({ db, tables });
	const tree: AdapterTreeInterface = createAdapterTreeInterface({ db, tables });
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
	const relations: AdapterRelationsInterface = createAdapterRelationsInterface({ db, tables });
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
