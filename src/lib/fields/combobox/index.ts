import type { FormField, Option } from 'rizom/types/index.js';
import { SelectFieldBuilder } from '../_builders/index.js';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates';
import toSnakeCase from 'to-snake-case';
import Combobox from './component/Combobox.svelte';
import type { FieldBluePrint } from 'rizom/types/fields';

export const blueprint: FieldBluePrint<ComboBoxField> = {
	component: Combobox,
	toSchema(field: ComboBoxField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is ComboBoxField => field.type === 'combobox'
};

export const combobox = (name: string) => new SelectFieldBuilder<ComboBoxField>(name, 'radio');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type ComboBoxField = FormField & {
	type: 'combobox';
	options: Option[];
	defaultValue: string;
	unique?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		combobox: any;
	}
	interface RegisterFormFields {
		ComboBoxField: ComboBoxField; // register the field type
	}
}
