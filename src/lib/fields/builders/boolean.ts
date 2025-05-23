import type { FieldsType, FieldValidationFunc, FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from './field.js';
import type { WithoutBuilders } from '$lib/util/types.js';

type BooleanField = FormField & {
	type: any;
	name: any;
	defaultValue?: any;
	validate?: FieldValidationFunc<BooleanField>;
};

export class BooleanFieldBuilder<T extends BooleanField> extends FormFieldBuilder<T> {
	constructor(name: string, type: FieldsType) {
		super(name, type);
		this.field.defaultValue = false;
	}

	defaultValue(value: boolean) {
		this.field.defaultValue = value;
		return this;
	}

	compile(): WithoutBuilders<T> {
		if (!this.field.validate) {
			this.field.validate = (value: unknown) =>
				typeof value === 'boolean' || 'Should be true/false';
		}
		if (!this.field.defaultValue) {
			this.field.defaultValue = false;
		}
		return super.compile();
	}
}
