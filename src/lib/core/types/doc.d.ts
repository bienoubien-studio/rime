import { GetRegisterType } from '$lib/index.js'

export type CollectionSlug = GetRegisterType<'CollectionSlug'>;
export type AreaSlug = GetRegisterType<'AreaSlug'>;
export type PrototypeSlug = CollectionSlug | AreaSlug;

import type { Dic } from '$lib/util/types.js';

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

