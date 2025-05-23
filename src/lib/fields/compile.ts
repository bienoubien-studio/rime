import { FieldBuilder } from './builders/index.js';
import type { Field } from '$lib/fields/types.js';

export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.map((f) => f.compile());
};
