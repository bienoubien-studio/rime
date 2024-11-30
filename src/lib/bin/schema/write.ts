import { spawnSync } from 'node:child_process';
import fs from 'fs';
import { taskLogger } from '../../logger/index.js';
import cache from '../cache/index.js';

const head = `
import { text, integer, sqliteTable, real } from "drizzle-orm/sqlite-core";
import { relations, type ColumnBaseConfig, type ColumnDataType } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';

const pk = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
`;

const write = (schema: string) => {
	const cachedSchema = cache.get('schema');

	if (cachedSchema && cachedSchema === schema) {
		// taskLogger.info('-  schema   :: No change detected');
		return;
	} else {
		cache.set('schema', schema);
	}

	if (!fs.existsSync('./src/lib/server')) {
		fs.mkdirSync('./src/lib/server');
	}

	fs.writeFile('./src/lib/server/schema.ts', [head, schema].join('\n\n'), (err) => {
		if (err) {
			console.error(err);
		} else {
			taskLogger.done('Schema: generated at src/lib/server/schema.ts');
			spawnSync('npx', ['drizzle-kit', 'push'], { stdio: 'inherit' });
		}
	});
};

export default write;

// type Args = { drizzleContent: string[]; zodContent: string[] };
