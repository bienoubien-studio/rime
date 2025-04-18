import { FieldBuilder } from './builders/index.js';
import type { Field } from 'rizom/types/fields.js';

export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.map((f) => f.compile());
};
