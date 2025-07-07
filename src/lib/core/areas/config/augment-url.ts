import { text } from '$lib/fields/text/index.server.js';
import type { Area } from '../../../types.js';

type Input = { url?: Area<any>['url']; fields: Area<any>['fields']; };

/**
 * Add url field
 */
export const augmentUrl = <T extends Input>(config: T): T => {
	let fields = [...config.fields];
	if (config.url) {
		fields = [...fields, text('url').localized().hidden()];
	}
	return {
		...config,
		fields
	};
};
