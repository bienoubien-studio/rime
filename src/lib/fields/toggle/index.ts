import type { FormField } from 'rizom/types';
import toSnakeCase from 'to-snake-case';
import { BooleanFieldBuilder } from '../_builders/boolean.js';
import type { FieldBluePrint } from 'rizom/types/fields';
import Toggle from './component/Toggle.svelte';

export const blueprint: FieldBluePrint<ToggleField> = {
	component: Toggle,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: integer('${snake_name}', { mode : 'boolean' })`;
	},
	toType: (field) => `${field.name}: boolean`
};

export const toggle = (name: string) => new BooleanFieldBuilder<ToggleField>(name, 'toggle');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type ToggleField = FormField & {
	type: 'toggle';
	defaultValue?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		toggle: any;
	}
	interface RegisterFormFields {
		ToggleField: ToggleField; // register the field type
	}
}
