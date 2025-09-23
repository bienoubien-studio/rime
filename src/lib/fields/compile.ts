import type { FieldBuilder } from '$lib/core/fields/builders/field-builder.js';
import type { Field } from '$lib/fields/types.js';

export const compileFields = (fields: FieldBuilder<Field>[]) => {
	return fields.map((f) => f.compile());
};
