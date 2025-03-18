import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates.js';
import Slug from './component/Slug.svelte';
import Cell from './component/Cell.svelte';

export const slug = (name: string) => new SlugFieldBuilder(name, 'slug');

class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	get component() {
		return Slug;
	}

	get cell() {
		return Cell;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}

	slugify(fieldName: string) {
		this.field.slugify = fieldName;
		return this;
	}

	unique() {
		this.field.unique = true;
		return this;
	}

	isTitle() {
		this.field.isTitle = true;
		return this;
	}
}

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SlugField = FormField & {
	type: 'slug';
	slugify?: string;
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		slug: any;
	}
	interface RegisterFormFields {
		SlugField: SlugField; // register the field type
	}
}
