import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { BooleanFieldBuilder } from '../builders/boolean.js';
import Toggle from './component/Toggle.svelte';
import Cell from './component/Cell.svelte';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';

export class ToggleFieldBuilder extends BooleanFieldBuilder<ToggleField> {
	constructor(name: string) {
		super(name, 'toggle');
		this.field.isEmpty = (value) => typeof value !== 'boolean';
		this.field.defaultValue = false;
	}

	get component() {
		return Toggle;
	}
	get cell() {
		return Cell;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: integer('${snake}', { mode: 'boolean' })${suffix}`;
	}

	_toType() {
		return `${this.field.name}: boolean`;
	}

	defaultValue(value: boolean | DefaultValueFn<boolean>) {
		this.field.defaultValue = value;
		return this;
	}

	compile() {
		if (!this.field.validate) {
			this.field.validate = (value: any) => {
				return typeof value === 'boolean' || 'Should be a boolean';
			};
		}
		return super.compile();
	}
}

export const toggle = (name: string) => new ToggleFieldBuilder(name);

/****************************************************/
/* Type
/****************************************************/

export interface ToggleField extends FormField {
	type: 'toggle';
	defaultValue?: boolean | DefaultValueFn<boolean>;
}

/****************************************************/
/* Register
/****************************************************/
declare module 'rizom' {
	interface RegisterFieldsType {
		toggle: any;
	}
	interface RegisterFormFields {
		ToggleField: ToggleField; // register the field type
	}
}
