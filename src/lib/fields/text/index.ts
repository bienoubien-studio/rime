import type { FormField } from 'rizom/types';

export { text, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type TextField = FormField & {
	type: 'text';
	defaultValue?: string;
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		text: any;
	}
	interface RegisterFormFields {
		TextField: TextField; // register the field type
	}
}
