import type { RelationField } from './index';
import type { GetRegisterType } from 'rizom/types/register';
import type { AnyField } from 'rizom/types';
import Relation from './component/Relation.svelte';
import { FormFieldBuilder } from '../field-builder';

export const blueprint = {
	component: Relation,
	toType: (field: RelationField) => `${field.name}: string`,
	match: (field: AnyField): field is RelationField => field.type === 'relation'
};

class RelationFieldBuilder extends FormFieldBuilder<RelationField> {
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

export const relation = (name: string) => new RelationFieldBuilder(name, 'relation');
