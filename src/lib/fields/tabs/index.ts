import type { AnyField } from 'rizom/types';
import type { BaseField } from 'rizom/types/fields';

export { tabs, tab, blueprint } from './field.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type TabsField = BaseField & {
	type: 'tabs';
	tabs: TabsFieldTab[];
};

export type TabsFieldTab = {
	label: string;
	fields: AnyField[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		tabs: any;
	}
	interface RegisterFields {
		TabsField: TabsField; // register the field type
	}
}
