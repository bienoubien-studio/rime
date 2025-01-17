import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import Number from './component/Number.svelte';
import type { FieldValidationFunc } from 'rizom/types/fields.js';
import type { PublicBuilder } from 'rizom/types/utility.js';

export const number = (name: string) =>
	new NumberFieldBuilder(name, 'number') as PublicBuilder<typeof NumberFieldBuilder>;

const validateValue: FieldValidationFunc<NumberField> = (value, { config }) => {
	if (typeof value !== 'number') {
		return 'Should be a number';
	}
	if (config.min && value < config.min) {
		return 'Should be greater than ' + config.min;
	}
	if (config.max && value > config.max) {
		return 'Should be lower than ' + config.max;
	}
	return true;
};

class NumberFieldBuilder extends FormFieldBuilder<NumberField> {
	get component() {
		return Number;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: number`;
	}

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		return `${this.field.name}: real('${snake_name}')`;
	}

	defaultValue(value: number) {
		this.field.defaultValue = value;
		return this;
	}

	min(value: number) {
		this.field.min = value;
		return this;
	}

	max(value: number) {
		this.field.max = value;
		return this;
	}

	toField() {
		if (!this.field.defaultValue) {
			this.field.defaultValue = this.field.min || 0;
		}
		if (!this.field.validate) {
			this.field.validate = validateValue;
		}
		return super.toField();
	}
}

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type NumberField = FormField & {
	type: 'number';
	min?: number;
	max?: number;
	defaultValue?: number;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		number: any;
	}
	interface RegisterFormFields {
		NumberField: NumberField; // register the field type
	}
}
