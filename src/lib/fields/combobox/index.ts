import type { FormField, OptionWithIcon } from '$lib/types/fields.js';
import { SelectFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/bin/generate/schema/templates.js';
import Combobox from './component/ComboBox.svelte';

class ComboBoxFieldBuilder extends SelectFieldBuilder<ComboBoxField> {
	get component() {
		return Combobox;
	}
	toType() {
		return `${this.field.name}: string`;
	}

	options(...options: OptionWithIcon[] | string[]) {
		return super.options(...options)
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
}

export const combobox = (name: string) => new ComboBoxFieldBuilder(name, 'combobox');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type ComboBoxField = FormField & {
	type: 'combobox';
	options: OptionWithIcon[];
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
