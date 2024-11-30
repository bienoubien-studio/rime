import { FormFieldBuilder } from '../field-builder.js';
import type { SelectField } from './index.js';
import { capitalize } from 'rizom/utils/string';
import type { Option } from 'rizom/types';
import toSnakeCase from 'to-snake-case';
import Select from './component/Select.svelte';
import type { FieldBluePrint } from '../index.js';

export const blueprint: FieldBluePrint<SelectField> = {
	component: Select,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}', { mode: 'json' })`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is SelectField => field.type === 'select'
};

class SelectFieldBuilder extends FormFieldBuilder<SelectField> {
	//
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

	many() {
		this.field.many = true;
		return this;
	}

	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}

	toField(): SelectField {
		// Normalize options
		this.field.options = this.field.options.map((option) => {
			const hasNoLabel = !('label' in option);
			if (hasNoLabel) {
				return {
					value: option.value,
					label: capitalize(option.value)
				};
			}
			return option;
		});
		return super.toField();
	}
}

export const select = (name: string) => new SelectFieldBuilder(name, 'select');
