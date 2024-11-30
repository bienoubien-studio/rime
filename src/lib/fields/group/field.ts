import type { GroupField } from './index.js';
import { FieldBuilder } from '../field-builder';
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
