import createAdapterCollectionInterface from './collection.js';
import createAdapterGlobalInterface from './global.js';
import createAdapterBlocksInterface from './blocks.js';
import createAdapterRelationsInterface from './relations.js';
import createAdapterAuthInterface from './auth.server.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { ConfigInterface } from 'rizom/config/index.server.js';
import { databaseTransformInterface } from './transform.js';
import { env } from '$env/dynamic/public';

const createAdapter = ({ schema, configInterface }: CreateAdapterArgs) => {
	const sqlite = new Database(`./db/${configInterface.raw.database}`);

	const db = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;

	const auth = createAdapterAuthInterface({
		db,
		schema,
		trustedOrigins: configInterface.raw.trustedOrigins || [env.PUBLIC_RIZOM_URL]
	});
	const blocks = createAdapterBlocksInterface({ db, tables });
	const collection = createAdapterCollectionInterface({ db, tables });
	const global = createAdapterGlobalInterface({ db, tables });
	const relations = createAdapterRelationsInterface({ db, tables });
	const transform = databaseTransformInterface({
		configInterface,
		tables,
		blocksInterface: blocks
	});

	return {
		collection,
		global,
		blocks,
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

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type CreateAdapterArgs = {
	schema: any;
	configInterface: ConfigInterface;
};
