import type { FieldValidationFunc, FormField } from 'rizom/types/fields';
import { FormFieldBuilder } from './field';

type BooleanField = FormField & {
	type: any;
	name: any;
	defaultValue?: any;
	validate?: FieldValidationFunc<BooleanField>;
};

export class BooleanFieldBuilder<T extends BooleanField> extends FormFieldBuilder<T> {
	defaultValue(value: boolean) {
		this.field.defaultValue = value;
		return this;
	}

	toField(): T {
		if (!this.field.validate) {
			this.field.validate = (value: unknown) =>
				typeof value === 'boolean' || 'Should be true/false';
		}
		if (!this.field.defaultValue) {
			this.field.defaultValue = false;
		}
		return super.toField();
	}
}
