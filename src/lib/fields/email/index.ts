import type { FormField } from 'rizom/types';

export { email, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type EmailField = FormField & {
	type: 'email';
	defaultValue?: string;
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		email: any;
	}
	interface RegisterFormFields {
		EmailField: EmailField; // register the field type
	}
}
