import type { BaseField } from 'rizom/types/fields';

export { separator, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SeparatorField = BaseField & {
	type: 'separator';
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		slug: any;
	}
	interface RegisterFields {
		SeparatorField: SeparatorField; // register the field type
	}
}
