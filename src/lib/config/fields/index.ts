import type { Component, ComponentType } from 'svelte';
import { capitalize } from 'rizom/utils/string.js';
import type {
	AnyField,
	AnyFormField,
	BlocksField,
	BlocksFieldBlock,
	BlocksFieldBlockRenderTitle,
	ComboBoxField,
	ComponentField,
	DateField,
	EmailField,
	FieldAccess,
	FieldsType,
	FieldValidationFunc,
	FieldWidth,
	GroupField,
	LinkField,
	LinkType,
	NumberField,
	Option,
	RadioField,
	RelationField,
	RichTextField,
	RichTextFieldMark,
	RichTextFieldNode,
	SelectField,
	SeparatorField,
	SlugField,
	TabsField,
	TabsFieldTab,
	TextField,
	ToggleField,
	UserDefinedField
} from 'rizom/types/fields.js';
import type { GetRegisterType } from 'rizom/types/doc.js';
import type { FieldPanelTableConfig } from 'rizom/types/panel.js';

export type FieldBuilderOutput = AnyField;

export class FieldBuilder<T extends AnyField> {
	field: T;

	constructor(type: FieldsType) {
		this.field = { type, live: true } as T;
	}

	toField(): T {
		return { ...this.field };
	}

	live(bool: boolean) {
		this.field.live = bool;
		return this;
	}
}

class FormFieldBuilder<T extends AnyFormField> extends FieldBuilder<T> {
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

class SlugFieldBuilder extends FormFieldBuilder<SlugField> {
	//
	slugify(fieldName: string) {
		this.field.slugify = fieldName;
		return this;
	}

	isTitle() {
		this.field.isTitle = true;
		return this;
	}
}

class TextFieldBuilder extends FormFieldBuilder<TextField> {
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
}

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
}

class NumberFieldBuilder extends FormFieldBuilder<NumberField> {
	//
	defaultValue(value: number) {
		this.field.defaultValue = value;
		return this;
	}

	min(value: number) {
		this.field.min = value;
		return this;
	}

	max(value: number) {
		this.field.max = value;
		return this;
	}
}

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
	types(...values: LinkType[]) {
		this.field.types = values;
		return this;
	}
}

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
}

class SelectFieldBuilder extends FormFieldBuilder<SelectField> {
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
	many() {
		this.field.many = true;
		return this;
	}
	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}
}

class SelectOneFieldBuilder extends FormFieldBuilder<ComboBoxField | RadioField> {
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

class RelationFieldBuilder extends FormFieldBuilder<RelationField> {
	to(table: GetRegisterType<'CollectionSlug'>) {
		this.field.relationTo = table;
		return this;
	}
	many() {
		this.field.many = true;
		return this;
	}
	defaultValue(...value: string[]) {
		this.field.defaultValue = value;
		return this;
	}
}

class RichTextFieldBuilder extends FormFieldBuilder<RichTextField> {
	constructor(name: string) {
		super(name, 'richText');
		this.field.marks = ['bold', 'italic', 'strike', 'underline'];
		this.field.nodes = ['p', 'h2', 'h3', 'ol', 'ul', 'blockquote', 'a'];
	}
	marks(...marks: RichTextFieldMark[]) {
		if (marks && marks[0]) {
			this.field.marks = marks;
		} else {
			this.field.marks = [];
		}
		return this;
	}
	nodes(...nodes: RichTextFieldNode[]) {
		if (nodes && nodes[0]) {
			this.field.nodes = nodes;
		} else {
			this.field.nodes = [];
		}
		return this;
	}
	defaultValue(value: { type: 'doc'; content: any[] }) {
		this.field.defaultValue = value;
		return this;
	}
}

class BlocksBuilder extends FormFieldBuilder<BlocksField> {
	constructor(name: string) {
		super(name, 'blocks');
		this.field.blocks = [];
	}

	blocks(...blocks: BlocksFieldBlock[]) {
		this.field.blocks = blocks;
		return this;
	}
}

class GroupBuilder extends FieldBuilder<GroupField> {
	//
	constructor(label?: string) {
		super('group');
		if (label) {
			this.field.label = label;
		}
	}
	fields(...fields: UserDefinedField[]) {
		// @ts-expect-error GroupField.fields is AnyField[] after config built
		// But need to type it as UserDefinedField for user definition
		this.field.fields = fields;
		return this;
	}
}

class ComponentFieldBuilder extends FieldBuilder<ComponentField> {
	//
	constructor(component: Component) {
		super('component');
		this.field.component = component;
	}
	condition(func: (doc: any) => boolean) {
		this.field.condition = func;
		return this;
	}
	access(access: { read?: FieldAccess }) {
		this.field.access = access;
		return this;
	}
}

export const blocks = (name: string) => new BlocksBuilder(name);
export const date = (name: string) => new DateFieldBuilder(name, 'date');
export const combobox = (name: string) => new SelectOneFieldBuilder(name, 'combobox');
export const component = (component: Component) => new ComponentFieldBuilder(component);
export const email = (name: string) => new EmailFieldBuilder(name, 'email');
export const group = (label?: string) => new GroupBuilder(label);
export const link = (name: string) => new LinkFieldBuilder(name, 'link');
export const number = (name: string) => new NumberFieldBuilder(name, 'number');
export const radio = (name: string) => new SelectOneFieldBuilder(name, 'radio');
export const relation = (name: string) => new RelationFieldBuilder(name, 'relation');
export const richText = (name: string) => new RichTextFieldBuilder(name);
export const select = (name: string) => new SelectFieldBuilder(name, 'select');
export const separator = () => new FieldBuilder<SeparatorField>('separator');
export const slug = (name: string) => new SlugFieldBuilder(name, 'slug');
export const tabs = (...tabs: TabsFieldTab[]) => new TabsBuilder(...tabs);
export const text = (name: string) => new TextFieldBuilder(name, 'text');
export const toggle = (name: string) => new FormFieldBuilder<ToggleField>(name, 'toggle');

class TabsBuilder extends FieldBuilder<TabsField> {
	//
	constructor(...tabs: TabsFieldTab[]) {
		super('tabs');
		this.field.tabs = tabs;
	}
}

class TabBuiler {
	#tab: TabsFieldTab;
	constructor(label: string) {
		this.#tab = { label, fields: [] };
		return this;
	}
	fields(...fields: UserDefinedField[]) {
		// @ts-expect-error TabField.fields is AnyField[] after config built
		// But need to type it as UserDefinedField for user definition
		this.#tab.fields = fields;
		return this.#tab;
	}
}

export const tab = (label: string) => new TabBuiler(label);

class BlockBuilder {
	#block: BlocksFieldBlock;
	constructor(name: string) {
		this.#block = { name, fields: [] };
	}
	/**
	 * Sets the icon, must be a lucide-svelte component
	 * @example
	 * import { Home } from 'lucide-svelte'
	 * block('home').icon(Home)
	 */
	icon(component: ComponentType) {
		this.#block.icon = component;
		return this;
	}
	renderTitle(render: BlocksFieldBlockRenderTitle) {
		this.#block.renderTitle = render;
		return this;
	}
	description(description: string) {
		this.#block.description = description;
		return this;
	}
	label(label: string) {
		this.#block.label = label;
		return this;
	}
	fields(...fields: UserDefinedField[]) {
		// @ts-expect-error BlockField.fields is AnyField[] after config built
		// But need to type it as UserDefinedField for user definition
		this.#block.fields = fields;
		return { ...this.#block };
	}
}

export const block = (name: string) => new BlockBuilder(name);
