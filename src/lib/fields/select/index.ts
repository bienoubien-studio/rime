import type { FormField, Option } from '$lib/fields/types.js';
import { SelectFieldBuilder } from '../builders/index.js';
import Select from './component/Select.svelte';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.js';

class SelectManyFieldBuilder extends SelectFieldBuilder<SelectField> {
	get component() {
		return Select;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		if (this.field.many) {
			return `${camel}: text('${snake}', { mode: 'json' })${templateUniqueRequired(this.field)}`;
		} else {
			return `${camel}: text('${snake}')${templateUniqueRequired(this.field)}`;
		}
	}

	toType() {
		const optionsJoinedType = this.field.options.map((o) => o.value).join(' | ');
		return `${this.field.name}${this.field.required ? '' : '?'}: (${optionsJoinedType})${this.field.many ? '[]' : ''}`;
	}

	many() {
		this.field.many = true;
		return this;
	}

	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}
}

export const select = (name: string) => new SelectManyFieldBuilder(name, 'select');

/****************************************************/
/* Type
/****************************************************/

export type SelectField = FormField & {
	type: 'select';
	options: Option[];
	defaultValue?: string | string[];
	many?: boolean;
};

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		select: any;
	}
	interface RegisterFormFields {
		SelectField: SelectField; // register the field type
	}
}
