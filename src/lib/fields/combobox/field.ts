import { SelectOneFieldBuilder } from '../field-builder.js';
import type { ComboBoxField } from './index.js';
import { capitalize } from 'rizom/utils/string.js';
import { templateUniqueRequired } from 'rizom/bin/schema/templates';
import toSnakeCase from 'to-snake-case';
import Combobox from './component/Combobox.svelte';
import type { FieldBluePrint } from '../index.js';

export const blueprint: FieldBluePrint<ComboBoxField> = {
	component: Combobox,
	toSchema(field: ComboBoxField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is ComboBoxField => field.type === 'combobox'
};

export const combobox = (name: string) => new ComboBoxFieldBuilder(name, 'radio');

class ComboBoxFieldBuilder extends SelectOneFieldBuilder<ComboBoxField> {
	//
	normalizeOptions() {
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
	}

	toField(): ComboBoxField {
		this.normalizeOptions();
		return super.toField();
	}
}
