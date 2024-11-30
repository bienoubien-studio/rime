import toSnakeCase from 'to-snake-case';
import { FormFieldBuilder } from '../field-builder.js';
import type { TextField } from './index.js';
import { templateUniqueRequired } from 'rizom/bin/schema/templates.js';
import type { FieldBluePrint } from '../index.js';
import Text from './component/Text.svelte';

export const blueprint: FieldBluePrint<TextField> = {
	component: Text,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is TextField => field.type === 'text'
};

//////////////////////////////////////////////
class TextFieldBuilder extends FormFieldBuilder<TextField> {
	unique() {
		this.field.unique = true;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}
	toField() {
		if (!this.field.validate) {
			this.field.validate = (value: any) => {
				console.log(value);
				return typeof value === 'string' || 'Should be a string';
			};
		}
		return super.toField();
	}
}

export const text = (name: string) => new TextFieldBuilder(name, 'text');
