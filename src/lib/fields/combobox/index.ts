import type { DefaultValueFn, FormField, OptionWithIcon } from '$lib/fields/types.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import Combobox from './component/ComboBox.svelte';
import { PickOneFieldBuilder } from '../builders/select.js';

class ComboBoxFieldBuilder extends PickOneFieldBuilder<ComboBoxField> {
	get component() {
		return Combobox;
	}
	toType() {
		return `${this.field.name}: string`;
	}

	options(...options: OptionWithIcon[] | string[]) {
		return super.options(...options);
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}
	defaultValue(value: string | DefaultValueFn<string>) {
		this.field.defaultValue = value;
		return this;
	}
}

export const combobox = (name: string) => new ComboBoxFieldBuilder(name, 'combobox');

/****************************************************/
/* Type
/****************************************************/
export type ComboBoxField = FormField & {
	type: 'combobox';
	options: OptionWithIcon[];
	defaultValue: string | DefaultValueFn<string>;
	unique?: boolean;
};

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		combobox: any;
	}
	interface RegisterFormFields {
		ComboBoxField: ComboBoxField; // register the field type
	}
}
