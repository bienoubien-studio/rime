import type { FormField } from 'rizom/types/fields.js';
import { BooleanFieldBuilder } from '../_builders/boolean.js';
import toSnakeCase from 'to-snake-case';
import Checkbox from './component/Checkbox.svelte';
import type { PublicBuilder } from 'rizom/types/utility.js';

class CheckboxFieldBuilder extends BooleanFieldBuilder<CheckboxField> {
	get component() {
		return Checkbox;
	}
	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		return `${this.field.name}: integer('${snake_name}', { mode : 'boolean' })`;
	}
	toType() {
		return `${this.field.name}: boolean`;
	}
}

export const checkbox = (name: string) =>
	new CheckboxFieldBuilder(name, 'checkbox') as PublicBuilder<typeof CheckboxFieldBuilder>;

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
