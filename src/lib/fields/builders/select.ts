import type { FieldsType, FieldValidationFunc, FormField, Option } from 'rizom/types/fields';
import { FormFieldBuilder } from './field';
import { capitalize } from 'rizom/utils/string';
import type { WithoutBuilders } from 'rizom/types/utility';

const ensureSelectIsOption: FieldValidationFunc<FieldWithOptions> = (value, { config }) => {
	const selected = value;
	const validValues = config.options.map((o) => o.value);
	if (selected && Array.isArray(selected)) {
		for (const value of selected) {
			if (!validValues.includes(value)) {
				return `Value should be one of these : ${validValues.join('|')}`;
			}
		}
	} else if (typeof selected === 'string') {
		if (!validValues.includes(selected)) {
			return `Value should be one of these : ${validValues.join('|')}`;
		}
	}
	return true;
};

type FieldWithOptions = FormField & {
	options: Option[];
	defaultValue?: any;
};

export class SelectFieldBuilder<T extends FieldWithOptions> extends FormFieldBuilder<T> {
	constructor(name: string, type: FieldsType) {
		super(name, type);
		this.field.isEmpty = (value) => Array.isArray(value) && value.length === 0;
		this.field.validate = ensureSelectIsOption;
	}

	options(...options: Option[] | string[]) {
		this.field.options = options.map((option) => {
			if (typeof option === 'string') {
				return { label: capitalize(option), value: option };
			} else {
				const hasNoLabel = !('label' in option);
				if (hasNoLabel) {
					return {
						value: option.value,
						label: capitalize(option.value)
					};
				}
			}
			return option;
		});

		return this;
	}

	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}

	compile() {
		if (!this.field.options) {
			throw new Error(`${this.field.name} should at least have one option`);
		}
		if (!this.field.defaultValue) {
			this.field.defaultValue = this.field.options[0].value;
		}
		return super.compile();
	}
}
