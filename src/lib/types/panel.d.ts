import type { Component, Snippet } from 'svelte';
import type { GenericDoc } from './doc.js';
import type { Dic } from './util.js';

export type Route = {
	title: string;
	icon: any;
	path: string;
};

export type FieldsComponents = {
	cell?: Component<any> | null;
	component: Component<any>;
};

export type FieldPanelTableConfig = {
	cell?: any;
	sort?: boolean;
	position: number;
};

export type CollectionLayoutProps = {
	data: {
		docs: GenericDoc[];
		status: number;
		canCreate: boolean;
	};
	children: Snippet;
};

export type PanelActionFailure<T extends Dic = Dic> = {
	form?: {
		[K in keyof T]: T[K];
	};
	errors?: Partial<FormErrors<keyof T>>;
};

export type FormErrors<T extends string = string> = Record<T, string>;
