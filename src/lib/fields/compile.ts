import type { AnyField, UserDefinedField } from 'rizom/types';
import { FieldBuilder } from './_builders/index.js';

export function compileField(field: UserDefinedField): AnyField {
	return field instanceof FieldBuilder ? field.toField() : field;
}
