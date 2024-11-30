export { checkbox, blueprint } from './field.js';

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
