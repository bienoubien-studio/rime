import type { FormField, Option } from 'rizom/types/index.js';
import { SelectFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import Select from './component/Select.svelte';

class SelectManyFieldBuilder extends SelectFieldBuilder<SelectField> {
	get component() {
		return Select;
	}

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		return `${this.field.name}: text('${snake_name}', { mode: 'json' })`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string[]`;
	}

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
