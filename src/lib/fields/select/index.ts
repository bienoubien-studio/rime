import type { DefaultValueFn, FormField, Option } from '$lib/fields/types.js';
import Select from './component/Select.svelte';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import { PickManyFieldBuilder } from '../builders/select.js';

class SelectFieldBuilder extends PickManyFieldBuilder<SelectField> {
	get component() {
		return Select;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field)
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		if (this.field.many) {
			return `${camel}: text('${snake}', { mode: 'json' })${suffix}`;
		} else {
			return `${camel}: text('${snake}')${suffix}`;
		}
	}
	
	_toType() {
		const optionsJoinedType = this.field.options.map((o) => o.value).join(' | ');
		return `${this.field.name}${this.field.required ? '' : '?'}: (${optionsJoinedType})${this.field.many ? '[]' : ''}`;
	}

}

export const select = (name: string) => new SelectFieldBuilder(name, 'select');

/****************************************************/
/* Type
/****************************************************/

export type SelectField = FormField & {
	type: 'select';
	options: Option[];
	defaultValue?: string[] | DefaultValueFn<string[]>;
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
