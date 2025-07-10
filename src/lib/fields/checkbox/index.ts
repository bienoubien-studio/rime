import type { FormField } from '$lib/fields/types.js';
import { BooleanFieldBuilder } from '../builders/boolean.js';
import Checkbox from './component/Checkbox.svelte';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';

class CheckboxFieldBuilder extends BooleanFieldBuilder<CheckboxField> {
	get component() {
		return Checkbox;
	}
	_toSchema(parentPath: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: integer('${snake}', { mode: 'boolean' })${suffix}`;
	}
	_toType() {
		return `${this.field.name}: boolean`;
	}
}

export const checkbox = (name: string) => new CheckboxFieldBuilder(name, 'checkbox');

/****************************************************/
/* Type
/****************************************************/
export type CheckboxField = FormField & {
	type: 'checkbox';
	defaultValue?: boolean;
};
