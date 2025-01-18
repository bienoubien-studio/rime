import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import validate from 'rizom/utils/validate';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates';
import toSnakeCase from 'to-snake-case';
import EmailComp from './component/Email.svelte';
import type { PublicBuilder } from 'rizom/types/utility.js';

class EmailFieldBuilder extends FormFieldBuilder<EmailField> {
	constructor(name: string) {
		super(name, 'email');
		this.field.validate = validate.email;
	}

	get component() {
		return EmailComp;
	}

	toType() {
		return `${this.field.name}${!this.field.required ? '?' : ''}: string`;
	}

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		const suffix = templateUniqueRequired(this.field);
		return `${this.field.name}: text('${snake_name}')${suffix}`;
	}

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

export const email = (name: string) =>
	new EmailFieldBuilder(name) as PublicBuilder<typeof EmailFieldBuilder>;

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
