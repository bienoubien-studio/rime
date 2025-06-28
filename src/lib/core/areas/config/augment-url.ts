import { text } from '$lib/fields/text/index.js';
import type { AugmentAreaFn } from './types.js';

/**
 * Add url field
 */
export const augmentUrl: AugmentAreaFn = ({ config, fields }) => {
	if (config.url) {
		fields = [...fields, text('url').localized().hidden()];
	}
	return {
		config,
		fields
	};
};
