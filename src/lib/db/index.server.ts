import createAdapterCollectionInterface from './collection.js';
import createAdapterGlobalInterface from './global.js';
import createAdapterBlocksInterface from './blocks.js';
import createAdapterRelationsInterface from './relations.js';
import createAdapterAuthInterface from './auth.js';
import { type Config } from 'drizzle-kit';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { taskLogger } from '../logger/index.js';
import type { ConfigInterface } from 'rizom/config/index.server.js';
import { databaseTransformInterface } from './transform.js';

const createAdapter = ({ schema, drizzleKitConfig, configInterface }: CreateAdapterArgs) => {
	// @ts-expect-error config.dbCredentials.url
	const sqlite = new Database(drizzleKitConfig.dbCredentials.url);
	const db = drizzle(sqlite, { schema: schema.default });
	const tables = schema.tables;
	// @ts-expect-error config.dbCredentials.url
	taskLogger.info('Using db at ' + drizzleKitConfig.dbCredentials.url);

	const auth = createAdapterAuthInterface({
		db,
		sessionsTable: schema.sessions,
		authUsersTable: schema.authUsers
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
	drizzleKitConfig: Config;
	configInterface: ConfigInterface;
};
