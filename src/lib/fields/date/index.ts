import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates';
import DateComponent from './component/Date.svelte';
import Cell from './component/Cell.svelte';

export const date = (name: string) => new DateFieldBuilder(name);

const stringToDate = (value: string) => {
	return new Date(value);
};

class DateFieldBuilder extends FormFieldBuilder<DateField> {
	//
	constructor(name: string) {
		super(name, 'date');
		this.field.hooks = {
			beforeValidate: [stringToDate],
			beforeSave: [],
			beforeRead: []
		};
	}

	get component() {
		return DateComponent;
	}

	get cell() {
		return Cell;
	}

	toType() {
		return `${this.field.name}${!this.field.required ? '?' : ''}: Date`;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		return `${camel}: integer('${snake}', { mode : 'timestamp' })${suffix}`;
	}

	defaultValue(value: Date) {
		this.field.defaultValue = value;
		return this;
	}

	isTitle() {
		this.field.isTitle = true;
		return this;
	}

	compile(): DateField {
		if (!this.field.defaultValue) {
			this.field.defaultValue = () => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				return date;
			};
		}

		return super.compile();
	}
}

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type DateField = FormField & {
	type: 'date';
	defaultValue?: Date | (() => Date);
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		date: any;
	}
	interface RegisterFormFields {
		DateField: DateField; // register the field type
	}
}
