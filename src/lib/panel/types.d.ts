import type { Component, Snippet } from 'svelte';
import type { GenericDoc } from '../core/types/doc.js';
import type { Dic, Pretty } from '$lib/util/types.js';
import type { WithRequired } from 'better-auth/svelte';

export type Route = {
	title: string;
	icon?: any;
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

export type CollectionListProps = {
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

export type Aria = Pretty<WithRequired<Partial<Route>, 'title'>>[];

export type FormErrors<T extends string = string> = Record<T, string>;
