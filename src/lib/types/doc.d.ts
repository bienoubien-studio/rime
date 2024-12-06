import type { RegisterCollection } from 'rizom';
import type { GetRegisterType } from './register.js';
import type { Dic } from './utility.js';
import type { RegisterGlobal } from 'rizom';

export type DocPrototype = 'global' | 'collection';

type BaseDoc = {
	id: string;
	title: string;
	updatedAt?: Date;
	createdAt?: Date;
	locale?: string;
	_prototype: DocPrototype;
	_type: GetRegisterType<'PrototypeSlug'>;
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

export type PrototypeSlug = CollectionSlug | GlobalSlug;
export type CollectionSlug = keyof RegisterCollection;
export type GlobalSlug = keyof RegisterGlobal;
