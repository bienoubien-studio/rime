import { GetRegisterType } from '$lib/index.js';

export type CollectionSlug = GetRegisterType<'CollectionSlug'>;
export type AreaSlug = GetRegisterType<'AreaSlug'>;
export type PrototypeSlug = CollectionSlug | AreaSlug;

import type { Dic, Pretty } from '$lib/util/types.js';

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
	_type: PrototypeSlug;
	_live?: string;
};

export type GenericDoc = Pretty<BaseDoc & Dic>;
export type GenericNestedDoc = Pretty<BaseDoc & { _children: string[]; _parent: string; _position: number } & Dic>;

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
