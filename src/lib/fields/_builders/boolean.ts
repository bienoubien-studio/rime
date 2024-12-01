import type { BaseField, FieldValidationFunc } from 'rizom/types/fields';
import { FormFieldBuilder } from './field';

type BooleanField = BaseField & {
	type: any;
	name: any;
	defaultValue?: any;
	validate?: FieldValidationFunc;
};

export class BooleanFieldBuilder<T extends BooleanField> extends FormFieldBuilder<T> {
	defaultValue(value: boolean) {
		this.field.defaultValue = value;
		return this;
	}

	toField(): T {
		if (!this.field.validate) {
			this.field.validate = (value: any) => typeof value === 'boolean' || 'Should be true/false';
		}
		if (!this.field.defaultValue) {
			this.field.defaultValue = false;
		}
		return super.toField();
	}
}
