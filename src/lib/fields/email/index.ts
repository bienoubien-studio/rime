import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import validate from 'rizom/utils/validate';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates';
import toSnakeCase from 'to-snake-case';
import Email from './component/Email.svelte';
import type { FieldBluePrint } from 'rizom/types/fields';

export const blueprint: FieldBluePrint<EmailField> = {
	component: Email,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}${!field.required ? '?' : ''}: string`,
	match: (field): field is EmailField => field.type === 'email'
};

class EmailFieldBuilder extends FormFieldBuilder<EmailField> {
	constructor(name: string) {
		super(name, 'email');
		this.field.validate = validate.email;
	}
	//
	unique() {
		this.field.unique = true;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}
}

export const email = (name: string) => new EmailFieldBuilder(name);

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type EmailField = FormField & {
	type: 'email';
	defaultValue?: string;
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		email: any;
	}
	interface RegisterFormFields {
		EmailField: EmailField; // register the field type
	}
}
