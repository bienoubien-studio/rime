import cache from '$lib/core/dev/cache/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import fs from 'fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const OUTPUT_DIR = '+rime.generated';

const write = (schema: string) => {
	const cachedSchema = cache.get('schema');

	if (cachedSchema && cachedSchema === schema) {
		return;
	}

	const outputPath = path.join('./src/lib', OUTPUT_DIR);
	const outputFile = path.join(outputPath, 'schema.server.ts');
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath);
	}

	try {
		fs.writeFileSync(outputFile, schema);
	} catch (err: any) {
		logger.error('Error writing schema', err.message);
	}

	logger.info('[✓] Schema: generated at src/lib/server/schema.ts');
	console.log('============================================================');
	console.log('\n ⚡︎ npx drizzle-kit generate \n');
	spawnSync('npx', ['drizzle-kit', 'generate'], { stdio: 'inherit' });
	console.log('\n============================================================');
	console.log('\n ⚡︎ npx drizzle-kit migrate \n');
	spawnSync('npx', ['drizzle-kit', 'migrate'], { stdio: 'inherit' });
	console.log('\n============================================================');
	cache.set('schema', schema);
};

export default write;
