import { isRolesField } from '$lib/util/field.js';
import { usersFields } from '../auth/config/usersFields.js';
import type { AugmentCollectionFn } from './types.js';

/**
 * Add auth email and roles fields
 */
export const augmentAuth: AugmentCollectionFn = ({ config, fields }) => {
	fields.push(usersFields.email);
	const rolesField = fields.find((field) => isRolesField(field.raw));
	if (!rolesField) {
		fields.push(usersFields.roles);
	}
	return {
		config,
		fields
	};
};
