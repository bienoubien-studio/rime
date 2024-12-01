import type { FormField } from 'rizom/types/fields.js';
import { BooleanFieldBuilder } from '../_builders/boolean.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Checkbox from './component/Checkbox.svelte';

export const blueprint = {
	component: Checkbox,
	toSchema(field: CheckboxField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: integer('${snake_name}', { mode : 'boolean' })`;
	},
	toType: (field: CheckboxField) => `${field.name}: string`,
	match: (field: AnyField): field is CheckboxField => field.type === 'checkbox'
};

export const checkbox = (name: string) => new BooleanFieldBuilder<CheckboxField>(name, 'checkbox');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type CheckboxField = FormField & {
	type: 'checkbox';
	defaultValue?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		checkbox: any;
	}
	interface RegisterFormFields {
		CheckboxField: CheckboxField; // register the field type
	}
}
