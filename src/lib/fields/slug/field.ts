import toSnakeCase from 'to-snake-case';
import { FormFieldBuilder } from '../field-builder.js';
import type { SlugField } from './index.js';
import { templateUniqueRequired } from 'rizom/bin/schema/templates.js';
import Slug from './component/Slug.svelte';
import Cell from './component/Cell.svelte';
import type { FieldBluePrint } from '../index.js';

export const blueprint: FieldBluePrint<SlugField> = {
	component: Slug,
	cell: Cell,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is SlugField => field.type === 'slug'
};

export const slug = (name: string) => new SlugFieldBuilder(name, 'slug');

class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	//
	slugify(fieldName: string) {
		this.field.slugify = fieldName;
		return this;
	}

	isTitle() {
		this.field.isTitle = true;
		return this;
	}
}
