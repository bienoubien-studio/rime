import { describe, expect, it } from 'vitest';
import { buildConfig } from 'rizom/config/build';
import rawConfig from './config';
import { buildConfigString } from '../browser';

describe('Test schema generation', async () => {
	const config = await buildConfig(rawConfig);
	const browserString = buildConfigString(config);

	it('should return expected schema', async () => {
		expect(browserString).not.toContain('__vite_ssr_import');
		expect(browserString).not.toContain('hash');
		expect(browserString).not.toContain('toSchema');
		expect(browserString).not.toContain('toType');
	});
});
