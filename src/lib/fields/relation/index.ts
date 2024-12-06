import type { FormField } from 'rizom/types';
import type { GetRegisterType } from 'rizom/types/register';
import type { AnyField } from 'rizom/types';
import Relation from './component/Relation.svelte';
import { FormFieldBuilder } from '../_builders/index.js';
import type { FieldHook } from 'rizom/types/fields';
import { capitalize } from 'rizom/utils/string';

export const blueprint = {
	component: Relation,
	toType: (field: RelationField) =>
		`${field.name}: RelationValue<${capitalize(field.relationTo)}Doc>`,
	match: (field: AnyField): field is RelationField => field.type === 'relation'
};

const ensureRelationExists: FieldHook<RelationField> = async (value, { api, config }) => {
	const output = [];

	const retrieveRelation = async (id: string) => {
		try {
			return await api.collection(config.relationTo).findById({ id });
		} catch (err: any) {
			console.log('Error in relation beforValidate hook : ' + err.message);
		}
		return null;
	};

	if (value && Array.isArray(value)) {
		for (const relation of value) {
			if (typeof relation === 'string') {
				const doc = await retrieveRelation(relation);
				if (doc) {
					output.push(doc.id);
				}
			}
		}
	} else if (typeof value === 'string') {
		const doc = await retrieveRelation(value);
		if (doc) {
			output.push(doc.id);
		}
	}
	if (config.name === 'author') {
		console.log('output of retrieve relations', output);
	}
	return output;
};

class RelationFieldBuilder extends FormFieldBuilder<RelationField> {
	//
	constructor(name: string) {
		super(name, 'relation');
		this.field.isEmpty = (value) => Array.isArray(value) && value.length === 0;
		this.field.hooks = { beforeValidate: [ensureRelationExists] };
	}

	to(slug: GetRegisterType<'CollectionSlug'>) {
		this.field.relationTo = slug;
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
	relationTo: GetRegisterType<'CollectionSlug'>;
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
