import type { FormField, Option } from 'rizom/types/index.js';
import { SelectFieldBuilder } from '../builders/index.js';
import Radio from './component/Radio.svelte';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates.js';

class RadioFieldBuilder extends SelectFieldBuilder<RadioField> {
	get component() {
		return Radio;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: text('${snake}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: string`;
	}
}

export const radio = (name: string) => new RadioFieldBuilder(name, 'radio');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////

export type RadioField = FormField & {
	type: 'radio';
	options: Option[];
	defaultValue: string;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		radio: any;
	}
	interface RegisterFormFields {
		RadioField: RadioField; // register the field type
	}
}
