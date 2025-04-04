import 'rizom';
import type { Session } from 'better-auth';
import type { BaseDoc, LocalAPI, Navigation, User, Rizom, UploadDoc } from 'rizom/types'

export type RelationValue<T> =
	| T[] // When depth > 0, fully populated docs
	| { id?: string; relationTo: string; documentId: string }[] // When depth = 0, relation objects
	| string[]
	| string; // When sending data to updateById
declare global {

export type PagesDoc = BaseDoc &  {
  attributes: {title: string,
		isHome: boolean,
		slug?: string,
		summary: {thumbnail?: RelationValue<MediasDoc>,
	intro?: import('@tiptap/core').JSONContent},
		parent?: RelationValue<PagesDoc>},
	layout: {hero: {title?: string,
	intro?: string,
	image?: RelationValue<MediasDoc>},
		sections: Array<BlockParagraph | BlockImage | BlockSlider | BlockKeyFacts | BlockBlack>,},
	metas: {title?: string,
		description?: string}
	status?: string
	editedBy?: string
	createdAt?: Date
	updatedAt?: Date
}

export type MediasDoc = BaseDoc & UploadDoc &  {
  alt: string
	mimeType?: string
	filename?: string
	filesize?: string
	editedBy?: string
	createdAt?: Date
	updatedAt?: Date
		sizes:{thumbnail: string, sm: string, md: string, lg: string, xl: string}
}

export type NewsDoc = BaseDoc &  {
  attributes: {title: string,
		slug: string,
		intro?: import('@tiptap/core').JSONContent,
		published?: Date},
	writer: {text?: import('@tiptap/core').JSONContent}
	editedBy?: string
	createdAt?: Date
	updatedAt?: Date
}

export type UsersDoc = BaseDoc &  {
  name: string
	email: string
	editedBy?: string
	createdAt?: Date
	updatedAt?: Date
	roles: string[]
}

export type SettingsDoc = BaseDoc &  {
  maintenance: boolean
	logo?: RelationValue<MediasDoc>
	editedBy?: string
	updatedAt?: Date
}

export type NavigationDoc = BaseDoc &  {
  header: {mainNav: Array<{path?: string,
position?: number,
label?: string,
link?: Link}>},
	footer: {footerNav: Array<{path?: string,
position?: number,
label?: string,
link?: Link}>}
	editedBy?: string
	updatedAt?: Date
}

export type InfosDoc = BaseDoc &  {
  email?: string
	instagram?: string
	address?: string
	editedBy?: string
	updatedAt?: Date
}

export type BlockParagraph = {
  id: string
  type: 'paragraph'
  text?: import('@tiptap/core').JSONContent
	type?: string
	path?: string
	position?: number
}

export type BlockImage = {
  id: string
  type: 'image'
  image?: RelationValue<MediasDoc>
	type?: string
	path?: string
	position?: number
}

export type BlockSlider = {
  id: string
  type: 'slider'
  images?: RelationValue<MediasDoc>
	type?: string
	path?: string
	position?: number
}

export type BlockKeyFacts = {
  id: string
  type: 'keyFacts'
  facts: Array<{path?: string,
position?: number,
title?: string,
description?: import('@tiptap/core').JSONContent,
icon?: string[],
image?: RelationValue<MediasDoc>}>
	type?: string
	path?: string
	position?: number
}

export type BlockBlack = {
  id: string
  type: 'black'
  title?: string
	text: Array<BlockParagraph | BlockImage | BlockSlider | BlockContent>,
	type?: string
	path?: string
	position?: number
}
export type BlockTypes = 'paragraph'|'image'|'slider'|'keyFacts'|'black'

export type AnyBlock = BlockParagraph|BlockImage|BlockSlider|BlockKeyFacts|BlockBlack

}
declare global {
  namespace App {
    interface Locals {
      session: Session | undefined;
      user: User | undefined;
      rizom: Rizom;
      api: LocalAPI;
      cacheEnabled: boolean;
      /** Available in panel, routes for sidebar */
      routes: Navigation;
      locale: string | undefined;
    }
  }
}
declare module 'rizom' {
	interface RegisterCollection {
		'pages': PagesDoc
		'medias': MediasDoc
		'news': NewsDoc
		'users': UsersDoc;
	}
	interface RegisterArea {
		'settings': SettingsDoc
		'navigation': NavigationDoc
		'infos': InfosDoc;
	}
}