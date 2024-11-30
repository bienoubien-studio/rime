import type { FormField } from 'rizom/types';

export { toggle, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type ToggleField = FormField & {
	type: 'toggle';
	defaultValue?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		toggle: any;
	}
	interface RegisterFormFields {
		ToggleField: ToggleField; // register the field type
	}
}
