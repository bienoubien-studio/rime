import type { AnyField, BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { UserDefinedField } from 'rizom/types';
import type { PublicBuilder } from 'rizom/types/utility.js';

class GroupFieldBuilder extends FieldBuilder<GroupField<'compiled'>> {
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

export const group = (label?: string) => new GroupFieldBuilder(label);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type GroupField<Compiled extends 'compiled' | 'uncompiled' = 'uncompiled'> = BaseField & {
	type: 'group';
	label: string;
	fields: Compiled extends 'compiled' ? AnyField[] : FieldBuilder<AnyField>[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		group: any;
	}
	interface RegisterFields {
		GroupField: GroupField<'compiled'>; // register the field type
	}
}
