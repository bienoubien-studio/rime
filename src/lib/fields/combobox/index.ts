import type { FormField, Option } from 'rizom/types/index.js';

export { combobox, blueprint } from './field.js';
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
