import toSnakeCase from 'to-snake-case';
import { BooleanFieldBuilder } from '../field-builder.js';
import type { ToggleField } from './index.js';
import type { FieldBluePrint } from '../index.js';
import Toggle from './component/Toggle.svelte';

export const blueprint: FieldBluePrint<ToggleField> = {
	component: Toggle,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: integer('${snake_name}', { mode : 'boolean' })`;
	},
	toType: (field) => `${field.name}: boolean`,
	match: (field): field is ToggleField => field.type === 'toggle'
};

export const toggle = (name: string) => new BooleanFieldBuilder<ToggleField>(name, 'toggle');
