import { FormFieldBuilder } from '$lib/core/fields/builders/form-field-builder.js';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import type { RegisterCollection } from '$lib/index.js';
import Cell from './component/Cell.svelte';
import RelationComponent from './component/Relation.svelte';

export class RelationFieldBuilder<Doc extends GenericDoc> extends FormFieldBuilder<RelationField<Doc>> {
	//
	_metaUrl = import.meta.url;

	constructor(name: string) {
		super(name, 'relation');
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
		this.field.defaultValue = [];
		if (import.meta.env.SSR) {
			import('./index.server.js').then((module) => {
				this.field.hooks = {
					beforeValidate: [module.ensureRelationExists]
				};
			});
		}
	}

	get component() {
		return RelationComponent;
	}

	get cell() {
		return Cell;
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
