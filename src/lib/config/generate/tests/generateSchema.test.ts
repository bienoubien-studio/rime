import { describe, expect, it } from 'vitest';
import { generateSchemaString } from '../schema/index.js';
import { buildConfig } from 'rizom/config/build';
import rawConfig from './config';
import { readFileSync } from 'fs';
import path from 'path';

describe('Test schema generation', async () => {
	// const config = await import()
	// 	.then((module) => module.default)
	// 	.then(async (config) => await buildConfig(config));
	const config = await buildConfig(rawConfig);
	const schema = generateSchemaString(config);
	// writeFileSync(path.join(__dirname, './expect-schema.txt'), schema);
	const expectedOutput = readFileSync(path.join(__dirname, './expect-schema.txt'), 'utf8');

	it('should return expected schema', async () => {
		expect(expectedOutput).toBe(schema);
	});
});
