import cache from '$lib/core/dev/cache/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import fs from 'fs';
import { spawnSync } from 'node:child_process';

const write = (schema: string) => {
	const cachedSchema = cache.get('schema');

	if (cachedSchema && cachedSchema === schema) {
		return;
	}

	if (!fs.existsSync('./src/lib/server')) {
		fs.mkdirSync('./src/lib/server');
	}

	fs.writeFile('./src/lib/server/schema.ts', schema, (err) => {
		if (err) {
			console.error(err);
		} else {
			logger.info('[✓] Schema: generated at src/lib/server/schema.ts');
			console.log('============================================================');
			console.log('\n ⚡︎ npx drizzle-kit generate \n');
			spawnSync('npx', ['drizzle-kit', 'generate'], { stdio: 'inherit' });
			console.log('\n============================================================');
			console.log('\n ⚡︎ npx drizzle-kit migrate \n');
			spawnSync('npx', ['drizzle-kit', 'migrate'], { stdio: 'inherit' });
			console.log('\n============================================================');
			cache.set('schema', schema);
		}
	});
};

export default write;
