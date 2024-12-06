import type { FormField, Option } from 'rizom/types/index.js';
import { SelectFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import Select from './component/Select.svelte';
import type { FieldBluePrint } from 'rizom/types/fields';

export const blueprint: FieldBluePrint<SelectField> = {
	component: Select,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}', { mode: 'json' })`;
	},
	toType: (field) => `${field.name}: string[]`,
	match: (field): field is SelectField => field.type === 'select'
};

class SelectManyFieldBuilder extends SelectFieldBuilder<SelectField> {
	many() {
		this.field.many = true;
		return this;
	}

	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}
}

export const select = (name: string) => new SelectManyFieldBuilder(name, 'select');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SelectField = FormField & {
	type: 'select';
	options: Option[];
	defaultValue: string | string[];
	many?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		select: any;
	}
	interface RegisterFormFields {
		SelectField: SelectField; // register the field type
	}
}
