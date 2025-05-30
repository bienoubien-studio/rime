import type { FormField, Option } from '$lib/fields/types.js';
import { SelectFieldBuilder } from '../builders/index.js';
import Radio from './component/Radio.svelte';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.js';

class RadioFieldBuilder extends SelectFieldBuilder<RadioField> {
	
	constructor(name: string) {
		super(name, 'radio');
		this.field.many = false
	}

	get component() {
		return Radio;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}
	
	toType() {
		const optionsString = this.field.options.map(option => `'${option.value}'` ).join(' | ')
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
	defaultValue: string;
	many: false;
};

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		radio: any;
	}
	interface RegisterFormFields {
		RadioField: RadioField; // register the field type
	}
}
