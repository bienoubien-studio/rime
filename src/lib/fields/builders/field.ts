import type { FieldsType } from 'rizom/types/fields.js';
import type { FieldPanelTableConfig } from 'rizom/types/panel';
import type {
	AnyFormField,
	Field,
	FieldAccess,
	FieldHook,
	FieldValidationFunc,
	FieldWidth,
	FormField
} from 'rizom/types/fields';
import { toSnakeCase } from 'rizom/util/string.js';
import { toCamelCase } from 'drizzle-orm/casing';
import type { Dic, WithoutBuilders } from 'rizom/types/util';
import type { Component } from 'svelte';
import cloneDeep from 'clone-deep';

export class FieldBuilder<T extends Field = Field> {
	field: T;

	constructor(type: FieldsType) {
		this.field = {
			type,
			live: true
		} as T;
	}

	className(str: string) {
		this.field.className = str;
		return this;
	}

	compile(): WithoutBuilders<T> {
		return this.field as WithoutBuilders<T>;
	}

	live(bool: boolean) {
		this.field.live = bool;
		return this;
	}

	get type() {
		return this.field.type;
	}

	get raw(): T {
		return this.field;
	}

	get component(): Component<any> | null {
		return null;
	}

	get cell(): Component<any> | null {
		return null;
	}
}

export class FormFieldBuilder<T extends FormField> extends FieldBuilder<T> {
	//
	constructor(name: string, type: FieldsType) {
		super(type);
		this.field.name = name;
		this.field.defaultValue = null;
		this.field.isEmpty = (value) => !value;
		this.field.access = {
			create: (user) => !!user,
			update: (user) => !!user,
			read: () => true
		};
		return this;
	}

	get name() {
		return this.field.name;
	}

	toType() {
		console.warn(this.field.type + ' missing toType not implementated');
		return '';
	}

	getSchemaName(parentPath?: string) {
		const name = parentPath ? `${parentPath}__${this.field.name}` : this.field.name;

		return {
			camel: name
				.split('__')
				.map((part) => toCamelCase(part))
				.join('__'),
			snake: name
				.split('__')
				.map((part) => toSnakeCase(part))
				.join('__')
		};
	}

	toSchema(parentPath?: string): string {
		console.warn(this.field.type + ' missing toSchema not implementated');
		return '';
	}

	label(label: string) {
		this.field.label = label;
		return this;
	}

	hidden() {
		this.field.hidden = true;
		return this;
	}

	localized() {
		this.field.localized = true;
		return this;
	}

	validate(validateFunction: FieldValidationFunc<T>) {
		this.field.validate = validateFunction as FieldValidationFunc<AnyFormField>;
		return this;
	}

	condition(conditionFunction: (doc: Dic, siblings: Dic) => boolean) {
		this.field.condition = conditionFunction;
		return this;
	}

	table(params?: FieldPanelTableConfig | number) {
		if (params === undefined) {
			this.field.table = { position: 99 };
		} else if (typeof params === 'number') {
			this.field.table = { position: params };
		} else {
			this.field.table = params;
		}
		return this;
	}

	width(value: FieldWidth) {
		this.field.width = value;
		return this;
	}

	required() {
		this.field.required = true;
		return this;
	}

	access(access: { create?: FieldAccess; read?: FieldAccess; update?: FieldAccess }) {
		this.field.access = { ...this.field.access, ...access };
		return this;
	}

	beforeRead(hook: FieldHook) {
		this.field.hooks!.beforeRead ??= [];
		this.field.hooks!.beforeRead.push(hook);
	}

	beforeSave(hook: FieldHook) {
		this.field.hooks!.beforeSave ??= [];
		this.field.hooks!.beforeSave.push(hook);
	}

	beforeValidate(hook: FieldHook) {
		this.field.hooks!.beforeValidate ??= [];
		this.field.hooks!.beforeValidate.push(hook);
	}

	clone<B extends FormFieldBuilder<T>>(): B {
		// Create a new instance of the same class
		const Constructor = this.constructor as new (...args: any[]) => B;
		// Get constructor parameters from the current instance
		const name = this.field.name;
		const type = this.field.type;
		
		// Create a new instance
		const clone = new Constructor(name, type);
		
		// Deep clone the field object to avoid reference issues
		clone.field = cloneDeep(this.field);
		
		return clone;
	}
}
