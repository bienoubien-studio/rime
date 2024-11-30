import { BooleanFieldBuilder } from '../field-builder.js';
import type { CheckboxField } from './index.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Checkbox from './component/Checkbox.svelte';

export const blueprint = {
	component: Checkbox,
	toSchema(field: CheckboxField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: integer('${snake_name}', { mode : 'boolean' })`;
	},
	toType: (field: CheckboxField) => `${field.name}: string`,
	match: (field: AnyField): field is CheckboxField => field.type === 'checkbox'
};

export const checkbox = (name: string) => new BooleanFieldBuilder<CheckboxField>(name, 'checkbox');
