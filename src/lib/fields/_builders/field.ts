import type { FieldPanelTableConfig, FieldsType } from 'rizom/types';
import type {
	BaseField,
	FieldAccess,
	FieldHook,
	FieldValidationFunc,
	FieldWidth,
	FormField
} from 'rizom/types/fields';

export class FieldBuilder<T extends BaseField> {
	field: T;

	constructor(type: FieldsType) {
		this.field = {
			type,
			live: true
		} as T;
	}

	toField(): T {
		return this.field;
	}

	live(bool: boolean) {
		this.field.live = bool;
		return this;
	}
}

export class FormFieldBuilder<T extends FormField> extends FieldBuilder<T> {
	//
	constructor(name: string, type: FieldsType) {
		super(type);
		this.field.name = name;
		this.field.isEmpty = (value: any) => !value;
		return this;
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

	validate(func: FieldValidationFunc<T>) {
		this.field.validate = func;
		return this;
	}

	condition(func: (doc: any) => boolean) {
		this.field.condition = func;
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
		this.field.access = access;
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
