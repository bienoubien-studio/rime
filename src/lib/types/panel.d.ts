import type { Component, Snippet } from 'svelte';
import type { GenericDoc } from './doc';
import type { Dic } from './utility';

export type Route = {
	title: string;
	icon: any;
	path: string;
};

export type FieldsComponents = {
	cell: Component | null;
	component: Component;
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
	error?: string;
	errors?: Partial<FormErrors<keyof T>>;
};

export type FormErrors<T extends string = string> = Record<T, string>;
