import type { FormField } from 'rizom/types';
import toSnakeCase from 'to-snake-case';
import { FormFieldBuilder } from '../_builders/index.js';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates.js';
import Slug from './component/Slug.svelte';
import Cell from './component/Cell.svelte';
import type { FieldBluePrint } from 'rizom/types/fields';

export const blueprint: FieldBluePrint<SlugField> = {
	component: Slug,
	cell: Cell,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}${field.required ? '' : '?'}: string`
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
