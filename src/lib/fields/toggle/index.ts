import type { FormField } from 'rizom/types';
import { BooleanFieldBuilder } from '../builders/boolean.js';
import Toggle from './component/Toggle.svelte';
import Cell from './component/Cell.svelte';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates.js';

export class ToggleFieldBuilder extends BooleanFieldBuilder<ToggleField> {
	constructor(name: string) {
		super(name, 'toggle');
	}

	get component() {
		return Toggle;
	}
	get cell() {
		return Cell;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: integer('${snake}', { mode: 'boolean' })${suffix}`;
	}

	toType() {
		return `${this.field.name}: boolean`;
	}

	defaultValue(value: boolean) {
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

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////

export interface ToggleField extends FormField {
	type: 'toggle';
	defaultValue?: boolean;
}

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
