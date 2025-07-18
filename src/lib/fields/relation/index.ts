import type { Relation } from '$lib/adapter-sqlite/relations';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import { RizomError } from '$lib/core/errors';
import { logger } from '$lib/core/logger/index.server';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { DefaultValueFn, FieldHook, FormField } from '$lib/fields/types.js';
import type { RegisterCollection } from '$lib/index.js';
import { capitalize } from '$lib/util/string';
import { FormFieldBuilder } from '../builders/index.js';
import Cell from './component/Cell.svelte';
import RelationComponent from './component/Relation.svelte';

type RelationValue = string | Array<Relation | string>;

const ensureRelationExists: FieldHook<RelationField<GenericDoc>> = async (value: RelationValue, { event, config }) => {
	const output = [];

	const retrieveRelation = async (id: string) => {
		try {
			return await event.locals.rizom.collection(config.relationTo).findById({ id, select: ['id'] });
		} catch (err: any) {
			logger.error('Error in relation beforValidate hook : ' + err.message);
			throw new RizomError(RizomError.OPERATION_ERROR, err.message);
		}
	};

	if (value && Array.isArray(value)) {
		for (const relation of value) {
			let documentId;
			if (typeof relation === 'string') {
				documentId = relation;
			} else {
				documentId = relation.documentId;
			}
			if (!documentId) {
				continue;
			}
			const doc = await retrieveRelation(documentId);
			if (doc) {
				output.push(relation);
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

class RelationFieldBuilder<Doc extends GenericDoc> extends FormFieldBuilder<RelationField<Doc>> {
	//
	constructor(name: string) {
		super(name, 'relation');
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
		this.field.defaultValue = [];
		this.field.hooks = { beforeValidate: [ensureRelationExists] };
	}

	get component() {
		return RelationComponent;
	}

	get cell() {
		return Cell;
	}

	_toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: RelationValue<${capitalize(this.field.relationTo)}Doc>`;
	}

	_toSchema() {
		const { camel, snake } = super._getSchemaName();
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: text('${snake}', { mode: 'json' })${suffix}`;
	}

	query(query: string | QueryResolver<Doc>) {
		(this.field as RelationField<Doc>).query = query;
		return this;
	}

	to<Slug extends CollectionSlug>(slug: Slug): RelationFieldBuilder<RegisterCollection[Slug]> {
		this.field.relationTo = slug;
		return this as unknown as RelationFieldBuilder<RegisterCollection[Slug]>;
	}

	many() {
		this.field.many = true;
		return this;
	}
	defaultValue(value: string | string[] | DefaultValueFn<string | string[]>) {
		this.field.defaultValue = value;
		return this;
	}
}

export const relation = (name: string) => new RelationFieldBuilder(name);

/****************************************************/
/* Type
/****************************************************/
export type RelationField<Doc extends GenericDoc = GenericDoc> = FormField & {
	type: 'relation';
	relationTo: CollectionSlug;
	layout?: 'tags' | 'list';
	many?: boolean;
	defaultValue?: string | string[] | DefaultValueFn<string | string[]>;
	query?: string | ((doc: Doc) => string);
};

type QueryResolver<Doc extends GenericDoc = GenericDoc> = (doc: Doc) => string;
