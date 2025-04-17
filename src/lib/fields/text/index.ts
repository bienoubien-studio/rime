import type { FormField } from '$lib/types';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/bin/generate/schema/templates.js';
import Text from './component/Text.svelte';
import { capitalize } from '$lib/util/string.js';

//////////////////////////////////////////////
class TextFieldBuilder extends FormFieldBuilder<TextField> {
	unique() {
		this.field.unique = true;
		return this;
	}

	get component() {
		return Text;
	}

	get cell() {
		return null;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}

	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}

	isTitle() {
		this.field.isTitle = true;
		return this;
	}

	placeholder(str: string) {
		this.field.placeholder = str;
		return this;
	}

	layout(layout: 'compact') {
		this.field.layout = layout;
		return this;
	}

	compile() {
		if (!this.field.validate) {
			this.field.validate = (value: any) => {
				return typeof value === 'string' || 'Should be a string';
			};
		}

		if (!this.field.placeholder) {
			this.field.placeholder = this.field.label || capitalize(this.field.name);
		}

		return super.compile();
	}
}

export const text = (name: string) => new TextFieldBuilder(name, 'text');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type TextField = FormField & {
	type: 'text';
	defaultValue?: string;
	unique?: boolean;
	isTitle?: true;
	placeholder: string;
	layout: 'compact';
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		text: any;
	}
	interface RegisterFormFields {
		TextField: TextField; // register the field type
	}
}
