import type { FormField, GenericDoc } from 'rizom/types';
import type { GetRegisterType, RegisterCollection } from 'rizom';
import RelationComponent from './component/Relation.svelte';
import { FormFieldBuilder } from '../_builders/index.js';
import type { FieldHook } from 'rizom/types/fields';
import { capitalize } from 'rizom/utils/string';
import type { PublicBuilder } from 'rizom/types/utility';
import type { Relation } from 'rizom/db/relations';

type RelationValue = string | Array<Relation | string>;

const ensureRelationExists: FieldHook<RelationField<GenericDoc>> = async (
	value: RelationValue,
	{ api, config }
) => {
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
			let relationId;
			if (typeof relation === 'string') {
				relationId = relation;
			} else {
				relationId = relation.relationId;
			}
			if (!relationId) {
				continue;
			}
			const doc = await retrieveRelation(relationId);
			if (doc) {
				output.push(doc.id);
			}
		}
	} else if (typeof value === 'string') {
		const doc = await retrieveRelation(value);
		if (doc) {
			output.push(doc.id);
		}
	}

	return output;
};

class RelationFieldBuilder<Doc extends GenericDoc = GenericDoc> extends FormFieldBuilder<
	RelationField<Doc>
> {
	//
	constructor(name: string) {
		super(name, 'relation');
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
		this.field.hooks = { beforeValidate: [ensureRelationExists] };
	}

	get component() {
		return RelationComponent;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: RelationValue<${capitalize(this.field.relationTo)}Doc>`;
	}

	query(query: string | QueryResolver<Doc>) {
		this.field.query = query;
		return this;
	}

	to<Slug extends GetRegisterType<'CollectionSlug'>>(
		slug: Slug
	): RelationFieldBuilder<RegisterCollection[Slug]> {
		this.field.relationTo = slug;
		return this as RelationFieldBuilder<RegisterCollection[Slug]>;
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
export type RelationField<Doc extends GenericDoc = GenericDoc> = FormField & {
	type: 'relation';
	relationTo: GetRegisterType<'CollectionSlug'>;
	layout?: 'tags' | 'list';
	many?: boolean;
	defaultValue?: string | string[];
	query?: string | QueryResolver<Doc>;
};

type QueryResolver<Doc extends GenericDoc = GenericDoc> = (doc: Doc) => string;

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
