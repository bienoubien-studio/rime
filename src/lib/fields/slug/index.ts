import type { FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.js';
import Slug from './component/Slug.svelte';
import Cell from './component/Cell.svelte';
import { validate } from '$lib/util/index.js';
import { slugify } from '$lib/util/string.js';

export const slug = (name: string) => new SlugFieldBuilder(name, 'slug');

class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	get component() {
		return Slug;
	}

	get cell() {
		return Cell;
	}

	placeholder(placeholder: string) {
		this.field.placeholder = placeholder;
		return this;
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

	layout(layout: 'compact' | 'default') {
		this.field.layout = layout;
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

	compile() {
		if (!this.field.validate) {
			this.field.validate = validate.slug;
		}

		if (!this.field.placeholder) {
			this.field.placeholder = slugify(this.field.label || this.field.name);
		}
		if (!this.field.isEmpty) {
			this.field.isEmpty = (value) => !value;
		}

		return super.compile();
	}
}

/****************************************************/
/* Type
/****************************************************/
export type SlugField = FormField & {
	type: 'slug';
	slugify?: string;
	unique?: boolean;
	isTitle?: true;
	placeholder: string;
	layout: 'compact' | 'default';
};

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		slug: any;
	}
	interface RegisterFormFields {
		SlugField: SlugField; // register the field type
	}
}
