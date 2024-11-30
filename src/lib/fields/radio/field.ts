import { SelectOneFieldBuilder } from '../field-builder.js';
import type { RadioField } from './index.js';
import { capitalize } from 'rizom/utils/string.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Radio from './component/Radio.svelte';

export const blueprint = {
	component: Radio,
	toSchema(field: RadioField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}')`;
	},
	toType: (field: RadioField) => `${field.name}: string`,
	match: (field: AnyField): field is RadioField => field.type === 'radio'
};

export const radio = (name: string) => new RadioFieldBuilder(name, 'radio');

class RadioFieldBuilder extends SelectOneFieldBuilder<RadioField> {
	//
	toField(): RadioField {
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
