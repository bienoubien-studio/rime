import type { Field } from 'rizom/types/fields';
import { FieldBuilder } from '../builders/index.js';

export class GroupFieldBuilder extends FieldBuilder<GroupField> {
	//
	constructor(label?: string) {
		super('group');
		if (label) {
			this.field.label = label;
		}
	}
	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = fields;
		return this;
	}
	compile() {
		return { ...this.field, fields: this.field.fields.map((f) => f.compile()) };
	}
}

export const group = (label?: string) => new GroupFieldBuilder(label);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type GroupField = Field & {
	type: 'group';
	label: string;
	fields: FieldBuilder<Field>[];
};

export type GroupFieldRaw = Field & {
	type: 'group';
	label: string;
	fields: Field[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		group: any;
	}
	interface RegisterFields {
		GroupField: GroupField;
	}
}
