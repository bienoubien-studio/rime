import type { Handle } from '@sveltejs/kit';
import type { BuiltConfig, RouteConfig } from './config';
import type { Component } from 'svelte';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;

export type Plugin<TArgs extends Dic = Dic> = (options?: TArgs) => {
	name: string;
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
	handler?: Handle;
	fields?: Array<{
		type: string;
		component: Component;
		cell: Component | null;
		toSchema: () => string;
		toType: () => string;
	}>;
};

export type MailerPlugin = {
	options: { from: string };
	sendMail: (args: {
		from: string;
		to: string;
		subject: string;
		text: string;
		html: string;
	}) => Promise<any>;
};
