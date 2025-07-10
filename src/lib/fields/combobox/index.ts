import type { DefaultValueFn, FormField, OptionWithIcon } from '$lib/fields/types.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import Combobox from './component/ComboBox.svelte';
import { PickOneFieldBuilder } from '../builders/select.js';

class ComboBoxFieldBuilder extends PickOneFieldBuilder<ComboBoxField> {
	get component() {
		return Combobox;
	}
	_toType() {
		return `${this.field.name}: string`;
	}

	options(...options: OptionWithIcon[] | string[]) {
		return super.options(...options);
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: text('${snake}')${suffix}`;
	}
	defaultValue(value: string | DefaultValueFn<string>) {
		this.field.defaultValue = value;
		return this;
	}
}

export const combobox = (name: string) => new ComboBoxFieldBuilder(name, 'combobox');

/****************************************************/
/* Type
/****************************************************/
export type ComboBoxField = FormField & {
	type: 'combobox';
	options: OptionWithIcon[];
	defaultValue: string | DefaultValueFn<string>;
	unique?: boolean;
};

