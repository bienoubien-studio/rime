import { FormFieldBuilder } from '../field-builder.js';
import type { DateField } from './index.js';
import { templateUniqueRequired } from 'rizom/bin/schema/templates';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Component from './component/Date.svelte';
import Cell from './component/Cell.svelte';

export const blueprint = {
	component: Component,
	cell: Cell,
	toSchema(field: DateField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: integer('${snake_name}', { mode : 'timestamp' })${suffix}`;
	},
	toType: (field: DateField) => `${field.name}: Date`,
	match: (field: AnyField): field is DateField => field.type === 'date'
};

export const date = (name: string) => new DateFieldBuilder(name, 'date');

class DateFieldBuilder extends FormFieldBuilder<DateField> {
	//
	defaultValue(value: Date) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}
	toField(): DateField {
		if (!this.field.defaultValue) {
			this.field.defaultValue = () => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				return date;
			};
		}

		return super.toField();
	}
}
