import { FormFieldBuilder } from '../field-builder.js';
import type { EmailField } from './index';
import validate from 'rizom/utils/validate';
import { templateUniqueRequired } from 'rizom/bin/schema/templates';
import toSnakeCase from 'to-snake-case';
import Email from './component/Email.svelte';
import type { FieldBluePrint } from '../index.js';

export const blueprint: FieldBluePrint<EmailField> = {
	component: Email,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field) => `${field.name}: string`,
	match: (field): field is EmailField => field.type === 'email'
};

class EmailFieldBuilder extends FormFieldBuilder<EmailField> {
	//
	unique() {
		this.field.unique = true;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}

	setDefaultValidation() {
		if (!this.field.validate) {
			this.field.validate = validate.email;
		}
	}

	toField(): EmailField {
		this.setDefaultValidation();
		return super.toField();
	}
}

export const email = (name: string) => new EmailFieldBuilder(name, 'email');
