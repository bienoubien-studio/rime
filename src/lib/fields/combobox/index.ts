import type { FormField, Option } from 'rizom/types/index.js';
import { SelectFieldBuilder } from '../_builders/index.js';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates';
import toSnakeCase from 'to-snake-case';
import Combobox from './component/Combobox.svelte';
import type { PublicBuilder } from 'rizom/types/utility.js';

class ComboBoxFieldBuilder extends SelectFieldBuilder<ComboBoxField> {
	get component() {
		return Combobox;
	}
	toType() {
		return `${this.field.name}: string`;
	}
	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		const suffix = templateUniqueRequired(this.field);
		return `${this.field.name}: text('${snake_name}')${suffix}`;
	}
}

export const combobox = (name: string) =>
	new ComboBoxFieldBuilder(name, 'combobox') as PublicBuilder<typeof ComboBoxFieldBuilder>;

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
