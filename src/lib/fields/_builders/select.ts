import type { FieldsType, FieldValidationFunc, FormField, Option } from 'rizom/types/fields';
import { FormFieldBuilder } from './field';
import { capitalize } from 'rizom/utils/string';

const ensureSelectIsOption: FieldValidationFunc<FieldWithOptions> = (value, { config }) => {
	const selected = value;
	const validValues = config.options.map((o) => o.value);
	if (selected && Array.isArray(selected)) {
		for (const value of selected) {
			if (!validValues.includes(value)) {
				return `Value should be one of these : ${validValues.join('|')}`;
			}
		}
	} else if (selected !== undefined) {
		if (!validValues.includes(selected)) {
			return `Value should be one of these : ${validValues.join('|')}`;
		}
	}
	return true;
};

type FieldWithOptions = FormField & {
	options: Option[];
	defaultValue?: string | string[];
};

export class SelectFieldBuilder<T extends FieldWithOptions> extends FormFieldBuilder<T> {
	constructor(name: string, type: FieldsType) {
		super(name, type);
		this.field.isEmpty = (value) => Array.isArray(value) && value.length === 0;
		//@ts-expect-error I don't care
		this.field.validate = ensureSelectIsOption;
	}

	options(...options: Option[] | string[]) {
		const formattedOptions = options.map((option) => {
			if (typeof option === 'string') {
				return { label: capitalize(option), value: option };
			}
			return option;
		});

		this.field.options = formattedOptions;
		return this;
	}

	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}

	normalizeOptions(field: T) {
		const options = field.options.map((option) => {
			const hasNoLabel = !('label' in option);
			if (hasNoLabel) {
				return {
					value: option.value,
					label: capitalize(option.value)
				};
			}
			return option;
		});
		return {
			...field,
			options
		};
	}

	static normalizeOptions(field: FieldWithOptions) {
		return new SelectFieldBuilder('tmp', field.type).normalizeOptions(field);
	}

	toField(): T {
		this.field = this.normalizeOptions(this.field);
		return super.toField();
	}
}
