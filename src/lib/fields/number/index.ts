import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Number from './component/Number.svelte';

export const blueprint = {
	component: Number,
	toSchema(field: NumberField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: real('${snake_name}')`;
	},
	toType: (field: NumberField) => `${field.name}: number`,
	match: (field: AnyField): field is NumberField => field.type === 'number'
};

export const number = (name: string) => new NumberFieldBuilder(name, 'number');

class NumberFieldBuilder extends FormFieldBuilder<NumberField> {
	//
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
			this.field.validate = (value) => {
				if (typeof value !== 'number') {
					return 'Should be a number';
				}
				if (this.field.min && value < this.field.min) {
					return 'Should be greater than ' + this.field.min;
				}
				if (this.field.max && value > this.field.max) {
					return 'Should be lower than ' + this.field.max;
				}
				return true;
			};
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
