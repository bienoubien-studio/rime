import type { AnyField, BaseField } from 'rizom/types/fields';

export { group } from './field.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type GroupField = BaseField & {
	type: 'group';
	label: string;
	fields: AnyField[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		group: any;
	}
	interface RegisterFields {
		GroupField: GroupField; // register the field type
	}
}
