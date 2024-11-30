import type { FieldBuilder } from '../config/fields';
import type { User } from './auth';
import type { GenericDoc } from './doc';
import type { GetRegisterType } from 'rizom/types/register';
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
