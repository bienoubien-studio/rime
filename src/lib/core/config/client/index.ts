import * as area from './area.js';
import * as collection from './collection.js';

import type { Config } from '$lib/types';

const buildConfig = (config: Config) => {
	console.log(config);
	return {
		collections: config.collections,
		areas: config.areas
	};
};

export { area, buildConfig, collection };
