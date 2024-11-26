import type { ComponentType } from 'svelte';
import type { FieldBuilder } from '../config/fields';
import type { User } from './auth';
import type { GenericDoc } from './doc';
import type { GetRegisterType } from './doc';
import type { FieldPanelTableConfig } from './panel';

export type UserDefinedField = AnyField | FieldBuilder<AnyField>;

type ValidationMetas<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	operation: 'create' | 'update' | undefined;
	id: string | undefined;
	user: User | undefined;
	locale: string | undefined;
};

type FieldValidationFunc = (value: any, metas: ValidationMetas) => true | string;
type FieldAccessParams = { id?: string };
type FieldAccess = (user: User | undefined, params?: FieldAccessParams) => boolean;
type FieldWidth = '1/3' | '1/2' | '2/3';

// Base type for all fields
type BaseField = {
	type: FieldsType;
	live?: boolean;
	condition?: (doc: any) => boolean;
	width?: FieldWidth;
	access?: {
		create?: FieldAccess;
		read?: FieldAccess;
		update?: FieldAccess;
	};
};

// Base type for fields that store data
type FormField = BaseField & {
	name: string;
	hidden?: boolean;
	validate?: FieldValidationFunc;
	required?: boolean;
	localized?: boolean;
	label?: string;
	table?: FieldPanelTableConfig | boolean;
};

export type SeparatorField = BaseField & {
	type: 'separator';
};

export type GroupField = BaseField & {
	type: 'group';
	label: string;
	fields: AnyField[];
};

export type TabsFieldTab = {
	label: string;
	fields: AnyField[];
};

export type TabsField = BaseField & {
	type: 'tabs';
	tabs: TabsFieldTab[];
};

export type TextField = FormField & {
	type: 'text';
	defaultValue?: string;
	unique?: boolean;
};

type LinkType = 'url' | 'email' | 'tel' | 'anchor' | GetRegisterType<'PrototypeSlug'>;
export type LinkField = FormField & {
	type: 'link';
	defaultValue?: string;
	unique?: boolean;
	types?: LinkType[];
};

export type EmailField = FormField & {
	type: 'email';
	defaultValue?: string;
	unique?: boolean;
};

export type SlugField = FormField & {
	type: 'slug';
	slugify?: string;
	unique?: boolean;
};

export type RelationField = FormField & {
	type: 'relation';
	relationTo: GetRegisterType<'PrototypeSlug'>;
	layout?: 'tags' | 'list';
	many?: boolean;
	defaultValue?: string | string[];
};

export type ToggleField = FormField & {
	type: 'toggle';
	defaultValue?: boolean;
};

export type CheckboxField = FormField & {
	type: 'checkbox';
	defaultValue?: boolean;
	unique?: boolean;
};

export type NumberField = FormField & {
	type: 'number';
	min?: number;
	max?: number;
	defaultValue?: number;
};

export type DateField = FormField & {
	type: 'date';
	defaultValue?: Date | (() => Date);
	unique?: boolean;
};

type RichTextFieldMark = 'bold' | 'italic' | 'underline' | 'strike' | false;
type RichTextFieldNode = 'p' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote' | 'a' | false;
export type RichTextField = FormField & {
	type: 'richText';
	marks: RichTextFieldMark[];
	nodes: RichTextFieldNode[];
	defaultValue?: { type: 'doc'; content: any[] };
};

export type RichTextMark = { type: string; attrs?: Record<string, any> };
export type RichTextNode<T extends string = string> = {
	type: T;
	content?: RichTextNode;
	text?: string;
	marks?: RichTextMark[];
} & (T extends 'heading' ? { attrs: Record<string, any> } : { attrs?: Record<string, any> }) &
	(T extends 'link' ? { url: string } : Record<never, never>);

export type SelectField = FormField & {
	type: 'select';
	options: Option[];
	defaultValue: string | string[];
	many?: boolean;
};

export type ComboBoxField = FormField & {
	type: 'combobox';
	options: Option[];
	defaultValue: string;
	unique?: boolean;
};

export type RadioField = FormField & {
	type: 'radio';
	options: Option[];
	defaultValue: string;
};

export type Option = {
	value: string;
	label?: string;
};

export type BlocksField = FormField & {
	type: 'blocks';
	blocks: BlocksFieldBlock[];
};

export type BlocksFieldBlockRenderTitle = ({ fields: Dic, position: number }) => string;

export type BlocksFieldBlock = {
	name: string;
	label?: string;
	description?: string;
	icon?: ComponentType;
	renderTitle?: BlocksFieldBlockRenderTitle;
	fields: AnyField[];
};

export type ComponentField = BaseField & {
	type: 'component';
	component: ComponentType;
};

export type AnyFormField =
	| BlocksField
	| CheckboxField
	| ComboBoxField
	| DateField
	| EmailField
	| LinkField
	| NumberField
	| RadioField
	| RelationField
	| RichTextField
	| SelectField
	| SlugField
	| TextField
	| ToggleField;

export type AnyField = AnyFormField | ComponentField | SeparatorField | GroupField | TabsField;

export type FieldsType =
	| 'blocks'
	| 'checkbox'
	| 'combobox'
	| 'component'
	| 'date'
	| 'email'
	| 'group'
	| 'link'
	| 'number'
	| 'radio'
	| 'relation'
	| 'richText'
	| 'select'
	| 'slug'
	| 'toggle'
	| 'tabs'
	| 'separator'
	| 'text';

export type Link = {
	label: string;
	type: LinkType;
	link: string;
	target: string;
	_url?: string;
};
