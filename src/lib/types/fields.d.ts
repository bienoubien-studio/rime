import type { FieldBuilder } from '../config/fields';
import type { User } from './auth';
import type { GenericDoc } from './doc';
import type { GetRegisterType } from 'rizom/types/register';
import type { FieldPanelTableConfig } from './panel';
import type { LocalAPI } from 'rizom/types/api';

export type UserDefinedField = AnyField | FieldBuilder<AnyField>;

type FieldValidationFunc<
	TConfig extends FormField = FormField,
	TData extends GenericDoc = GenericDoc
> = (
	value: any,
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
type FieldAccess = (user: User | undefined, params?: FieldAccessParams) => boolean;
type FieldWidth = '1/3' | '1/2' | '2/3';

export type FieldBluePrint<T extends AnyField = AnyField> = {
	component: any;
	cell?: any;
	toSchema?: (field: T) => string;
	toType?: (field: T) => string;
	match: (field: AnyField) => field is T;
	defaultValue?: any;
	validate?: any;
};

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
	// table?: FieldPanelTableConfig | boolean;
	table?: FieldPanelTableConfig;
	hooks?: FieldHooks;
	isEmpty: (value: any) => boolean;
};

type BaseSelectField = FormField & {
	defaultValue: string | string[];
	options: Option[];
};

type FieldHookMeta<T extends AnyFormField = AnyFormField> = {
	api: LocalAPI;
	locale?: string;
	config: T;
};
type FieldHook<T extends FormField> = (value: any, metas: FieldHookMeta<T>) => any;
type FieldHooks = {
	beforeRead?: FieldHook[];
	beforeValidate?: FieldHook[];
	beforeSave?: FieldHook[];
};

export type Option = {
	value: string;
	label?: string;
};

export type AnyFormField = GetRegisterType<'AnyFormField'>;

export type AnyField = AnyFormField | GetRegisterType<'AnyField'>;

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
