import type { AnyField, BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';

class GroupBuilder extends FieldBuilder<GroupField> {
	//
	constructor(label?: string) {
		super('group');
		if (label) {
			this.field.label = label;
		}
	}
	fields(...fields: UserDefinedField[]) {
		this.field.fields = fields;
		return this;
	}
}

export const group = (label?: string) => new GroupBuilder(label);

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
