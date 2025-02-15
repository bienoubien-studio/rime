import type { Option } from 'rizom/types';
import type { FormField } from 'rizom/types';
import { SelectFieldBuilder } from '../builders/index.js';
import Radio from './component/Radio.svelte';
import toSnakeCase from 'to-snake-case';

class RadioFieldBuilder extends SelectFieldBuilder<RadioField> {
	get component() {
		return Radio;
	}

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		return `${this.field.name}: text('${snake_name}')`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}
}

export const radio = (name: string) => new RadioFieldBuilder(name, 'radio');

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
