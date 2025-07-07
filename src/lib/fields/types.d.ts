import type { User } from '../core/collections/auth/types';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { GetRegisterType } from '$lib/index.js';
import type { FieldPanelTableConfig } from '../panel/types';
import type { DocumentFormContext } from '$lib/panel';
import type { RequestEvent } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { IconProps } from '@lucide/svelte';

export type { BlocksField, BlocksFieldBlock } from './blocks/index.js';
export type { CheckboxField } from './checkbox/index.js';
export type { ComboBoxField } from './combobox/index.js';
export type { ComponentField } from './component/index.js';
export type { DateField } from './date/index.js';
export type { EmailField } from './email/index.server.js';
export type { GroupField } from './group/index.js';
export type { LinkField } from './link/index.js';
export type { NumberField } from './number/index.js';
export type { RadioField } from './radio/index.js';
export type { RelationField } from './relation/index.js';
export type { RichTextField } from './rich-text/index.js';
export type { SelectField } from './select/index.js';
export type { SeparatorField } from './separator/index.js';
export type { SlugField } from './slug/index.js';
export type { TabsField } from './tabs/index.js';
export type { TextField } from './text/index.server.js';
export type { TimeField } from './time/index.js';
export type { TextAreaField } from './textarea/index.js';
export type { ToggleField } from './toggle/index.js';

export type FieldValidationFunc<TConfig extends FormField, TData extends GenericDoc = GenericDoc> = (
	value: unknown,
	metas: {
		data: Partial<TData>;
		operation: 'create' | 'update' | undefined;
		id: string | undefined;
		user: User | undefined;
		locale: string | undefined;
		config: TConfig;
	}
) => true | string;

type FieldAccessParams = { id?: string };
export type FieldAccess = (user: User | undefined, params?: FieldAccessParams) => boolean;
export type FieldWidth = '1/3' | '1/2' | '2/3';

// Base type for all fields
export type Field = {
	type: FieldsType;
	live?: boolean;
	condition?: (doc: any, siblings: any) => boolean;
	width?: FieldWidth;
	className?: string;
	access: {
		create: FieldAccess;
		read: FieldAccess;
		update: FieldAccess;
	};
};

// Base type for fields that store data
export type FormField = Field & {
	name: string;
	hidden?: boolean;
	readonly?: boolean;
	validate?: FieldValidationFunc<this, GenericDoc>;
	required?: boolean;
	localized?: boolean;
	label?: string;
	table?: FieldPanelTableConfig;
	hooks?: FieldHooks;
	defaultValue?: unknown;
	isEmpty: (value: unknown) => boolean;
};

export type DefaultValueFn<T> = ({ event }: { event: RequestEvent}) => T

type FieldHookContext<T extends AnyFormField = AnyFormField> = {
	event: RequestEvent;
	/** The document Id being processed */
	documentId?: string;
	/** The field config */
	config: T;
};

export type FieldHookOnChange = (
	value: any,
	context: {
		siblings: Record<string, any>;
		useField: DocumentFormContext['useField'];
		useBlocks: DocumentFormContext['useBlocks'];
		useTree: DocumentFormContext['useTree'];
	}
) => void;

export type FieldHook<T extends FormField = any> = (value: any, context: FieldHookContext<T>) => any;

type FieldHooks = {
	beforeRead?: FieldHook[];
	beforeValidate?: FieldHook[];
	beforeSave?: FieldHook[];
	onChange?: FieldHookOnChange[];
};

export type Option = {
	value: string;
	label?: string;
};

export type OptionWithIcon = {
	value: string;
	label?: string;
	icon?: Component<IconProps>;
};

export type RelationValue<T> = T[] | { id?: string; relationTo: string; documentId: string }[] | string[] | string;

export type AnyFormField = GetRegisterType<'AnyFormField'>;
export type AnyField = AnyFormField | GetRegisterType<'AnyField'>;
export type FieldsType = GetRegisterType<'FieldsType'>;
