import * as area from './area.js';
import * as collection from './collection.js';

import type { Config } from '../types.js';

const buildConfig = (config: Config) => {
	console.log(config);
	return config;
};

export { area, buildConfig, collection };
