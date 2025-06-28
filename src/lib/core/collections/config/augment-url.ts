import { text } from '$lib/fields/text/index.js';
import type { AugmentCollectionFn } from './types.js';

/**
 * Add url field
 */
export const augmentUrl: AugmentCollectionFn = ({ config, fields }) => {
	if(config.url){
		fields = [...fields, text('url').localized().hidden()];
	}
	return {
		config,
		fields
	};
};
