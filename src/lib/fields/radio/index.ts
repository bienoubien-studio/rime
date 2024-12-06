import type { Option } from 'rizom/types';
import type { FormField } from 'rizom/types';
import { SelectFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Radio from './component/Radio.svelte';

export const blueprint = {
	component: Radio,
	toSchema(field: RadioField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}')`;
	},
	toType: (field: RadioField) => `${field.name}${field.required ? '' : '?'}: string`,
	match: (field: AnyField): field is RadioField => field.type === 'radio'
};

export const radio = (name: string) => new SelectFieldBuilder<RadioField>(name, 'radio');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type RadioField = FormField & {
	type: 'radio';
	options: Option[];
	defaultValue: string;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		radio: any;
	}
	interface RegisterFormFields {
		RadioField: RadioField; // register the field type
	}
}
