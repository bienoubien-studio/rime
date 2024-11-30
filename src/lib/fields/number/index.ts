import type { FormField } from 'rizom/types';

export { number, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type NumberField = FormField & {
	type: 'number';
	min?: number;
	max?: number;
	defaultValue?: number;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		number: any;
	}
	interface RegisterFormFields {
		NumberField: NumberField; // register the field type
	}
}
