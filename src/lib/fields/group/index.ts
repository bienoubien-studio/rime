import type { AnyField, BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import type { PublicBuilder } from 'rizom/types/utility.js';

class GroupFieldBuilder extends FieldBuilder<GroupField> {
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

export const group = (label?: string) =>
	new GroupFieldBuilder(label) as PublicBuilder<typeof GroupFieldBuilder>;

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type GroupField = BaseField & {
	type: 'group';
	label: string;
	fields: FieldBuilder<AnyField>[];
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
