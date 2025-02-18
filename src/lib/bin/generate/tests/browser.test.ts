import { describe, expect, it } from 'vitest';
import { buildConfig } from 'rizom/config/build';
import rawConfig from './config';
import { buildConfigString } from '../browser';
import { buildComponentsMap } from 'rizom/config/build/fields/componentMap';
import { compileConfig } from 'rizom/config/compile.server';

describe('Test schema generation', async () => {
	const builtConfig = await buildConfig(rawConfig, { generateFiles: false, compiled: false });
	const collectionFields = builtConfig.collections.flatMap((collection) => collection.fields);
	const areaFields = builtConfig.areas.flatMap((area) => area.fields);
	let fieldsComponentsMap = buildComponentsMap([...collectionFields, ...areaFields]);
	const compiledConfig = compileConfig(builtConfig);
	const browserString = buildConfigString({
		...compiledConfig,
		blueprints: fieldsComponentsMap
	});

	it('should not be dirty', async () => {
		expect(browserString).not.toContain('__vite_ssr_import');
		expect(browserString).not.toContain('hash');
		expect(browserString).not.toContain('toSchema');
		expect(browserString).not.toContain('toType');
	});
});
