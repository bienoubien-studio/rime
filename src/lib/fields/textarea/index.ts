import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import TextArea from './component/TextArea.svelte';
import { capitalize } from '$lib/util/string.js';

export const textarea = (name: string) => new TextAreaFieldBuilder(name, 'textarea');

class TextAreaFieldBuilder extends FormFieldBuilder<TextAreaField> {
	get component() {
		return TextArea;
	}

	get cell() {
		return null;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: text('${snake}')${suffix}`;
	}

	_toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}

	defaultValue(value: string | DefaultValueFn<string>) {
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

/****************************************************/
/* Type
/****************************************************/
export type TextAreaField = FormField & {
	type: 'textarea';
	defaultValue?: string | DefaultValueFn<string>;
	isTitle?: true;
	placeholder: string;
};
