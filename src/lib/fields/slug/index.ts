import { FormFieldBuilder } from '$lib/core/fields/builders/form-field-builder.js';
import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { validate } from '$lib/util/index.js';
import { slugify } from '$lib/util/string.js';
import Cell from './component/Cell.svelte';
import Slug from './component/Slug.svelte';

export const slug = (name: string) => new SlugFieldBuilder(name, 'slug');

export class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	//
	_metaUrl = import.meta.url;

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

	slugify(fieldName: string) {
		this.field.slugify = fieldName;
		return this;
	}

	layout(layout: 'compact' | 'default') {
		this.field.layout = layout;
		return this;
	}

	defaultValue(value: string | DefaultValueFn<string>) {
		this.field.defaultValue = value;
		return this;
	}

	unique(bool?: boolean) {
		this.field.unique = typeof bool === 'boolean' ? bool : true;
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
	defaultValue?: string | DefaultValueFn<string>;
	unique?: boolean;
	isTitle?: true;
	placeholder: string;
	layout: 'compact' | 'default';
};
