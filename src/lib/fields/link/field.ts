import type { LinkField, LinkType } from './index.js';
import { FormFieldBuilder } from '../field-builder';
import toSnakeCase from 'to-snake-case';
import Link from './component/Link.svelte';
import type { FieldBluePrint } from '../index.js';
import validate from 'rizom/utils/validate.js';

export const blueprint: FieldBluePrint<LinkField> = {
	component: Link,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}', { mode: 'json' })`;
	},
	toType: (field) => `${field.name}${field.required ? '' : '?'}: Link`,
	match: (field): field is LinkField => field.type === 'link'
};

class LinkFieldBuilder extends FormFieldBuilder<LinkField> {
	//
	unique() {
		this.field.unique = true;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
	defineValidationFunction() {
		return validate.link;
	}
	types(...values: LinkType[]) {
		this.field.types = values;
		return this;
	}
}

export const link = (name: string) => new LinkFieldBuilder(name, 'link');
