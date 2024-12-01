import type { FormField } from 'rizom/types';
import type { GetRegisterType } from 'rizom/types/register';
import type { AnyField } from 'rizom/types';
import Relation from './component/Relation.svelte';
import { FormFieldBuilder } from '../_builders/index.js';

export const blueprint = {
	component: Relation,
	toType: (field: RelationField) => `${field.name}: string`,
	match: (field: AnyField): field is RelationField => field.type === 'relation'
};

class RelationFieldBuilder extends FormFieldBuilder<RelationField> {
	//
	constructor(name: string) {
		super(name, 'relation');
		this.field.isEmpty = (value) => Array.isArray(value) && value.length === 0;
	}

	to(table: GetRegisterType<'CollectionSlug'>) {
		this.field.relationTo = table;
		return this;
	}
	many() {
		this.field.many = true;
		return this;
	}
	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}
}

export const relation = (name: string) => new RelationFieldBuilder(name);

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type RelationField = FormField & {
	type: 'relation';
	relationTo: GetRegisterType<'PrototypeSlug'>;
	layout?: 'tags' | 'list';
	many?: boolean;
	defaultValue?: string | string[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		relation: any;
	}
	interface RegisterFormFields {
		RelationField: RelationField; // register the field type
	}
}
