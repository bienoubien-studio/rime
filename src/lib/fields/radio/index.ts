import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import type { DefaultValueFn, FormField, Option } from '$lib/fields/types.js';
import { PickOneFieldBuilder } from '../builders/select.js';
import Radio from './component/Radio.svelte';

class RadioFieldBuilder extends PickOneFieldBuilder<RadioField> {
	constructor(name: string) {
		super(name, 'radio');
		this.field.many = false;
		this.field.layout = 'default';
	}

	get component() {
		return Radio;
	}

	layout(value: 'default' | 'row') {
		this.field.layout = value;
		return this;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if (this._generateSchema) return this._generateSchema({ camel, snake, suffix });
		return `${camel}: text('${snake}')${suffix}`;
	}

	_toType() {
		const optionsString = this.field.options.map((option) => `'${option.value}'`).join(' | ');
		return `${this.field.name}${this.field.required ? '' : '?'}: ${optionsString}`;
	}
}

export const radio = (name: string) => new RadioFieldBuilder(name);

/****************************************************/
/* Type
/****************************************************/

export type RadioField = FormField & {
	type: 'radio';
	options: Option[];
	layout: 'row' | 'default';
	defaultValue: string | DefaultValueFn<string>;
	many: false;
};
