import type { GetRegisterType } from './register';
import type { Dic } from './utility';

export type DocPrototype = 'global' | 'collection';

type BaseDoc = {
	id: string;
	title: string;
	updatedAt?: Date;
	createdAt?: Date;
	locale?: string;
	_prototype: DocPrototype;
	_type: DocTables;
	_url?: string;
	_live?: string;
};

export type GenericDoc = BaseDoc & Dic;

export type GenericBlock<T extends string = string> = {
	id: string;
	type: T;
	parentId?: string;
	position?: number;
	path?: string;
} & Dic;

export type UploadDoc = BaseDoc & {
	title: string;
	mimeType: string;
	filesize: string;
	filename: string;
	url: string;
	sizes?: { [key: string]: string };
} & Dic;

export type PrototypeSlug = GetRegisterType<'PrototypeSlug'>;
export type CollectionSlug = GetRegisterType<'CollectionSlug'>;
export type GlobalSlug = GetRegisterType<'GlobalSlug'>;
