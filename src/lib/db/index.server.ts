import createAdapterCollectionInterface, { type AdapterCollectionInterface } from './collection.js';
import createAdapterAreaInterface, { type AdapterAreaInterface } from './area.js';
import createAdapterBlocksInterface, { type AdapterBlocksInterface } from './blocks.js';
import createAdapterRelationsInterface, { type AdapterRelationsInterface } from './relations.js';
import createAdapterAuthInterface from './auth.server.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { ConfigInterface } from 'rizom/config/index.server.js';
import { databaseTransformInterface, type AdapterTransformInterface } from './transform.js';
import createAdapterTreeInterface, { type AdapterTreeInterface } from './tree.js';

const createAdapter = ({ schema, configInterface }: CreateAdapterArgs) => {
	const sqlite = new Database(`./db/${configInterface.raw.database}`);

	const db = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;

	const auth = createAdapterAuthInterface({
		db,
		schema,
		trustedOrigins: configInterface.raw.trustedOrigins
	});
	const blocks: AdapterBlocksInterface = createAdapterBlocksInterface({ db, tables });
	const tree: AdapterTreeInterface = createAdapterTreeInterface({ db, tables });
	const collection: AdapterCollectionInterface = createAdapterCollectionInterface({ db, tables });
	const area: AdapterAreaInterface = createAdapterAreaInterface({ db, tables });
	const relations: AdapterRelationsInterface = createAdapterRelationsInterface({ db, tables });
	const transform: AdapterTransformInterface = databaseTransformInterface({
		configInterface,
		tables,
		treeInterface: tree,
		blocksInterface: blocks
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
//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type CreateAdapterArgs = {
	schema: any;
	configInterface: ConfigInterface;
};
