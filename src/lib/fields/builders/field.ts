import type { FieldPanelTableConfig, FieldsType } from 'rizom/types';
import type {
	AnyFormField,
	Field,
	FieldAccess,
	FieldHook,
	FieldValidationFunc,
	FieldWidth,
	FormField
} from 'rizom/types/fields';
import type { Dic, WithoutBuilders } from 'rizom/types/utility';
import type { Component } from 'svelte';

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
		console.log(this.field.type + ' missing toType not implementated');
		return '';
	}

	toSchema() {
		console.log(this.field.type + ' missing toSchema not implementated');
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
}
