import { describe, expect, it } from 'vitest';
import { generateSchemaString } from '../schema/index.js';
import { buildConfig } from 'rizom/config/build';
import rawConfig from './config';
import { readFileSync } from 'fs';
import path from 'path';

describe('Test schema generation', async () => {
	const config = await buildConfig(rawConfig, { generate: false });
	const schema = generateSchemaString(config);
	const expectedOutput = readFileSync(path.join(__dirname, './expect-schema.txt'), 'utf8');

	it('should return expected schema', async () => {
		expect(schema).toBe(expectedOutput);
	});
});
