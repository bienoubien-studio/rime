import type { FormField, Option } from 'rizom/types/index.js';

export { select, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SelectField = FormField & {
	type: 'select';
	options: Option[];
	defaultValue: string | string[];
	many?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		select: any;
	}
	interface RegisterFormFields {
		SelectField: SelectField; // register the field type
	}
}
