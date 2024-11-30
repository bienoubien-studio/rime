import type { FormField } from 'rizom/types';

export { date, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type DateField = FormField & {
	type: 'date';
	defaultValue?: Date | (() => Date);
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		date: any;
	}
	interface RegisterFormFields {
		DateField: DateField; // register the field type
	}
}
