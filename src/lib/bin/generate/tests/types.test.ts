import { describe, expect, it } from 'vitest';
import { generateTypesString } from '../types/index.js';
import { buildConfig } from 'rizom/config/build';
import rawConfig from './config';
import { readFileSync } from 'fs';
import path from 'path';

describe('Test schema generation', async () => {
	const config = await buildConfig(rawConfig, { generateFiles: false, compiled: false });
	const types = generateTypesString(config);

	const expectedOutput = readFileSync(path.join(__dirname, './expect-types.txt'), 'utf8');

	it('should return expected schema', async () => {
		expect(types).toBe(expectedOutput);
	});
});
