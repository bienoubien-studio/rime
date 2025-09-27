import type { SimplerField, TextField } from '$lib/fields/types.js';

export const directoryInput: SimplerField<TextField> = {
	type: 'text',
	name: 'name',
	isEmpty: (value) => !value,
	validate: (value) => {
		const pattern = /^[a-zA-Z0-9-_ ]+$/;
		if (typeof value !== 'string' || !pattern.test(value)) {
			return 'Incorrect folder name';
		}
		return true;
	}
};
