import type { RegisterCollection } from '$lib';
import type { GetRegisterType } from '$lib';
import type { Dic } from './util.js';
import type { RegisterArea } from '$lib';

export type DocPrototype = 'area' | 'collection';

export type RawDoc = Dic & { id: string };

type BaseDoc = {
	id: string;
	title: string;
	updatedAt?: Date;
	createdAt?: Date;
	locale?: string;
	url?: string;
	_prototype: DocPrototype;
	_type: GetRegisterType<'PrototypeSlug'>;
	_live?: string;
};

export type GenericDoc = BaseDoc & Dic;

export type TreeBlock = {
	id: string;
	ownerId?: string;
	path?: string;
	position?: number;
	_children: TreeBlock[];
} & Dic;

export type GenericBlock<T extends string = string> = {
	id: string;
	type: T;
	ownerId?: string;
	position?: number;
	path?: string;
} & Dic;

export type UploadDoc = BaseDoc & {
	title: string;
	mimeType: string;
	filesize: string;
	filename: string;
	url: string;
	sizes: { [key: string]: string };
} & Dic;

export type PrototypeSlug = CollectionSlug | AreaSlug;
export type CollectionSlug = keyof RegisterCollection;
export type AreaSlug = keyof RegisterArea;
