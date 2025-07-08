import { FormFieldBuilder } from '../builders/index.js';
import Number from './component/Number.svelte';
import type { FormField, FieldValidationFunc, DefaultValueFn } from '$lib/fields/types.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';

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
		this.field.isEmpty = (value) => typeof value !== 'number';
	}

	get component() {
		return Number;
	}

	_toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: number`;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: real('${snake}')${suffix}`;
	}

	defaultValue(value: number | DefaultValueFn<number>) {
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

	compile() {
		if (!this.field.defaultValue) {
			this.field.defaultValue = this.field.min || 0;
		}
		return super.compile();
	}

	_root() {
		this.field._root = true;
		return this;
	}
}

/****************************************************/
/* Type
/****************************************************/

export type NumberField = FormField & {
	type: 'number';
	min?: number;
	max?: number;
	defaultValue?: number | DefaultValueFn<number>;
	/**
	 * Force the field to be on the root table
	 * usefull for fields that should not be versioned
	 * ex: _parent for nested structures should always be on the root table to prevent
	 * different versions to have different parents
	 */
	_root?: boolean;
};

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		number: any;
	}
	interface RegisterFormFields {
		NumberField: NumberField;
	}
}
