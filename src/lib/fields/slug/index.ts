import type { FormField } from 'rizom/types';

export { slug, blueprint } from './field.js';

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
