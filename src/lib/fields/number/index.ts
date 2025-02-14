import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import toSnakeCase from 'to-snake-case';
import Number from './component/Number.svelte';
import type { FieldValidationFunc } from 'rizom/types/fields.js';

export const number = (name: string) => new NumberFieldBuilder(name);

const validateNumber: FieldValidationFunc<NumberField> = (value, { config }) => {
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
	constructor(name: string) {
		super(name, 'number');
		this.field.validate = validateNumber;
	}

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
		NumberField: NumberField;
	}
}
