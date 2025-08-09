import type {
	Field,
	FieldAccess,
	FieldHook,
	FieldHookOnChange,
	FieldValidationFunc,
	FieldWidth,
	FormField
} from '$lib/fields/types.js';
import type { FieldPanelTableConfig } from '$lib/panel/types';
import { toSnakeCase } from '$lib/util/string.js';
import type { Dic, WithoutBuilders } from '$lib/util/types';
import cloneDeep from 'clone-deep';
import { toCamelCase } from 'drizzle-orm/casing';
import type { Component } from 'svelte';

export class FieldBuilder<T extends Field = Field> {
	field: T;

	constructor(type: string) {
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

type GenerateSchemaFn = (args: { camel: string; snake: string; suffix: string }) => string;

export class FormFieldBuilder<T extends FormField> extends FieldBuilder<T> {
	_generateSchema: null | GenerateSchemaFn = null;

	constructor(name: string, type: string) {
		super(type);
		this.field.name = name;
		this.field.hooks = {};
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

	_toType() {
		console.warn(this.field.type + ' missing toType not implementated');
		return '';
	}

	_getSchemaName(parentPath?: string) {
		const name = parentPath ? `${parentPath}__${this.field.name}` : this.field.name;

		// Preserve leading underscore if present
		const hasLeadingUnderscore = name.startsWith('_');
		const processedName = hasLeadingUnderscore ? name.slice(1) : name;

		const processParts = (parts: string[], formatter: (s: string) => string) => {
			const processed = parts.map((part) => formatter(part)).join('__');
			return hasLeadingUnderscore ? `_${processed}` : processed;
		};

		const parts = processedName.split('__');

		return {
			camel: processParts(parts, toCamelCase),
			snake: processParts(parts, toSnakeCase)
		};
	}

	_toSchema(parentPath: string): string {
		console.warn(
			`${this.field.type} ${parentPath ? `@${parentPath}/${this.field.name}` : ''}missing toSchema not implementated`
		);
		return '';
	}

	generateSchema(fn: GenerateSchemaFn) {
		this._generateSchema = fn;
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

	readonly() {
		this.field.readonly = true;
		return this;
	}

	localized() {
		this.field.localized = true;
		return this;
	}

	validate(validateFunction: FieldValidationFunc<T>) {
		this.field.validate = validateFunction as FieldValidationFunc<FormField>;
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

	beforeRead(hook: FieldHook<T>) {
		this.field.hooks!.beforeRead ??= [];
		this.field.hooks!.beforeRead.push(hook);
		return this;
	}

	beforeSave(hook: FieldHook<T>) {
		this.field.hooks!.beforeSave ??= [];
		this.field.hooks!.beforeSave.push(hook);
		return this;
	}

	beforeValidate(hook: FieldHook<T>) {
		this.field.hooks!.beforeValidate ??= [];
		this.field.hooks!.beforeValidate.push(hook);
		return this;
	}
	
	onChange(hook: FieldHookOnChange) {
		this.field.hooks!.onChange ??= [];
		this.field.hooks!.onChange.push(hook);
		return this;
	}

	hint(hint:string){
		this.field.hint = hint
		return this
	}
	
	clone(): typeof this {
		// Create a new instance of the same class
		const Constructor = this.constructor as new (...args: any[]) => typeof this;
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
