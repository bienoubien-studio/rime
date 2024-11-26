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

export interface BaseRegister {
	PrototypeSlug: string;
	CollectionSlug: string;
	GlobalSlug: string;
	Plugins: object;
}

export type GetRegisterType<K extends keyof BaseRegister> = import('rizom').Register[K];
export type PrototypeSlug = GetRegisterType<'PrototypeSlug'>;
export type CollectionSlug = GetRegisterType<'CollectionSlug'>;
export type GlobalSlug = GetRegisterType<'GlobalSlug'>;
