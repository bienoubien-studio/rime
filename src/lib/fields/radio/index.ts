import type { Option } from 'rizom/types';
import type { FormField } from 'rizom/types';

export { radio, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type RadioField = FormField & {
	type: 'radio';
	options: Option[];
	defaultValue: string;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		radio: any;
	}
	interface RegisterFormFields {
		RadioField: RadioField; // register the field type
	}
}
