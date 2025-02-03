import { flatten } from 'flat';
import cache from '../../bin/generate/cache/index.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/utility.js';

const serializeValue = (value: any): string => {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';

	switch (typeof value) {
		case 'function':
			// Handle functions
			if (Object.prototype.hasOwnProperty.call(value, 'render')) {
				return `func:${value.name}`;
			}
			return `func:${value.toString()}`;

		case 'object':
			// Handle arrays and objects
			try {
				if (Array.isArray(value)) {
					return `array:${JSON.stringify(value)}`;
				}
				// Handle Date objects
				if (value instanceof Date) {
					return `date:${value.toISOString()}`;
				}
				// Handle regular objects
				return `object:${JSON.stringify(value)}`;
			} catch (err: any) {
				return `error:${err.message}`;
			}

		default:
			// Handle primitive values
			return `${typeof value}:${value}`;
	}
};

const writeMemo = (config: BuiltConfig) => {
	const memo: Dic = flatten(config);
	// const memoStr = JSON.stringify(config);
	const memoStr = Object.entries(memo)
		.map(([key, value]) => {
			try {
				const serializedValue = serializeValue(value);
				return `${key}:${serializedValue}`;
			} catch (err: any) {
				throw new Error(`Config error : Unable to parse value for key ${key}: ${err.message}`);
			}
		})
		.join('\n');

	const cached = cache.get('config');

	if (cached !== memoStr) {
		cache.set('config', memoStr);
		// taskLogger.done('Config: config cached');
		return true;
	} else {
		// taskLogger.info('-  config   :: No change detected');
		return false;
	}
};

export default writeMemo;
