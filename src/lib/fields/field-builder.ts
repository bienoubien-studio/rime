import type { AnyField, AnyFormField, FieldPanelTableConfig, FieldsType } from 'rizom/types';
import type {
	BaseField,
	FieldAccess,
	FieldValidationFunc,
	FieldWidth,
	Option
} from 'rizom/types/fields';
import { capitalize } from 'rizom/utils/string';

export class FieldBuilder<T extends AnyField> {
	field: T;

	constructor(type: FieldsType) {
		this.field = {
			type,
			live: true
		} as T;
	}

	toField(): T {
		return { ...this.field };
	}

	live(bool: boolean) {
		this.field.live = bool;
		return this;
	}
}

export class FormFieldBuilder<T extends AnyFormField> extends FieldBuilder<T> {
	//
	constructor(name: string, type: FieldsType) {
		super(type);
		this.field.name = name;
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

	validate(func: FieldValidationFunc) {
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
}

type SelectOneField = BaseField & {
	type: any;
	name: any;
	options: Option[];
	defaultValue?: string;
};

export class SelectOneFieldBuilder<T extends SelectOneField> extends FormFieldBuilder<T> {
	//
	options(...options: Option[] | string[]) {
		const formattedOptions = options.map((option) => {
			if (typeof option === 'string') {
				return { label: capitalize(option), value: option };
			}
			return option;
		});

		this.field.options = formattedOptions;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
}

type BooleanField = BaseField & {
	type: any;
	name: any;
	defaultValue?: any;
	validate?: FieldValidationFunc;
};

export class BooleanFieldBuilder<T extends BooleanField> extends FormFieldBuilder<T> {
	defaultValue(value: boolean) {
		this.field.defaultValue = value;
		return this;
	}

	toField(): T {
		if (!this.field.validate) {
			this.field.validate = (value: any) => typeof value === 'boolean' || 'Should be true/false';
		}
		if (!this.field.defaultValue) {
			this.field.defaultValue = false;
		}
		return super.toField();
	}
}
