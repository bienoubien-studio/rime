import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import TimeComponent from './component/Time.svelte';

export const time = (name: string) => new TimeFieldBuilder(name);

class TimeFieldBuilder extends FormFieldBuilder<TimeField> {
	//
	constructor(name: string) {
		super(name, 'time');
		this.field.defaultValue = '08:00';
		this.field.validate = (value) => {
			if (typeof value === 'string' && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
				return true;
			}
			return 'incorrect time format ' + value;
		};
	}

	get component() {
		return TimeComponent;
	}

	_toType() {
		return `${this.field.name}${!this.field.required ? '?' : ''}: string`;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: text('${snake}')${suffix}`;
	}

		defaultValue(value: string | DefaultValueFn<string>) {
			this.field.defaultValue = value;
			return this;
		}
}

/****************************************************/
/* Type
/****************************************************/
export type TimeField = FormField & {
	type: 'time';
	defaultValue?: string | DefaultValueFn<string>;
	unique?: boolean;
	isTitle?: true;
};
