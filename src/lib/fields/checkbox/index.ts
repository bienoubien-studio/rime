import type { FormField } from 'rizom/types/fields.js';
import { BooleanFieldBuilder } from '../builders/boolean.js';
import Checkbox from './component/Checkbox.svelte';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates.js';

class CheckboxFieldBuilder extends BooleanFieldBuilder<CheckboxField> {
	get component() {
		return Checkbox;
	}
	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: integer('${snake}', { mode: 'boolean' })${suffix}`;
	}
	toType() {
		return `${this.field.name}: boolean`;
	}
}

export const checkbox = (name: string) => new CheckboxFieldBuilder(name, 'checkbox');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type CheckboxField = FormField & {
	type: 'checkbox';
	defaultValue?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		checkbox: any;
	}
	interface RegisterFormFields {
		CheckboxField: CheckboxField;
	}
}
