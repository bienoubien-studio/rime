import type { BuiltConfig, RouteConfig } from '$lib/core/config/types.js';
import type { GetRegisterType } from '$lib/index.js';
import type { Handle } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { CacheActions } from '../plugins/cache/index.js';
import type { MailerActions } from '../plugins/mailer/types.js';
import type { SSEActions } from '../plugins/sse/index.js';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;

export type CorePlugins = {
	cache: CacheActions;
	mailer: MailerActions;
	sse: SSEActions;
};

export type Plugin<T = void> = (options?: T) => {
	name: string;
	core?: boolean;
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
	handler?: Handle;
	fields?: Array<{
		type: string;
		component: Component;
		cell: Component | null;
		_toSchema: () => string;
		_toType: () => string;
	}>;
};

export type MailerPlugin = {
	options: { from: string };
	sendMail: (args: { from: string; to: string; subject: string; text: string; html: string }) => Promise<any>;
};

export type Plugins = CorePlugins & GetRegisterType<'Plugins'>;
