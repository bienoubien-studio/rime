import type { FormField } from 'rizom/types';
import toSnakeCase from 'to-snake-case';
import { FormFieldBuilder } from '../_builders/index.js';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates.js';
import Slug from './component/Slug.svelte';
import Cell from './component/Cell.svelte';
import type { PublicBuilder } from 'rizom/types/utility.js';

export const slug = (name: string) =>
	new SlugFieldBuilder(name, 'slug') as PublicBuilder<typeof SlugFieldBuilder>;

class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	get component() {
		return Slug;
	}

	get cell() {
		return Cell;
	}

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		const suffix = templateUniqueRequired(this.field);
		return `${this.field.name}: text('${snake_name}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}

	slugify(fieldName: string) {
		this.field.slugify = fieldName;
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
