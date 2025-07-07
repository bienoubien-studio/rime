import { text } from '$lib/fields/text/index.server.js';
import { date } from '$lib/fields/date/index.js';
import type { Area } from '../../../types.js';

type Input = { fields: Area<any>['fields'] };

/**
 * Add updatedAt createdAt editedBy fields
 * to an Area
 */
export const augmentMetas = <T extends Input>( config: T ): T => {
	const fields = [ ...config.fields ]
	fields.push(
		//
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	);
	return { ...config, fields };
};
