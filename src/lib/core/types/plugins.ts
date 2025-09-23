import type { BuiltConfig, BuiltConfigClient, RouteConfig } from '$lib/core/config/types.js';
import type { GetRegisterType } from '$lib/index.js';
import type { Handle } from '@sveltejs/kit';
import type { CacheActions } from '../plugins/cache/index.server.js';
import type { MailerActions } from '../plugins/mailer/types.js';
import type { SSEActions } from '../plugins/sse/index.server.js';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;

export type CorePlugins = {
	cache: CacheActions;
	mailer: MailerActions;
	sse: SSEActions;
};

export type Plugin<T = void> = (options?: T) => {
	name: string;
	type: 'server';
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
	handler?: Handle;
};

export type PluginClient<T = void> = (options?: T) => {
	name: string;
	type: 'client';
	configure?: <T extends BuiltConfigClient>(config: T) => T;
};

export type MailerPlugin = {
	options: { from: string };
	sendMail: (args: { from: string; to: string; subject: string; text: string; html: string }) => Promise<any>;
};

export type Plugins = CorePlugins & GetRegisterType<'Plugins'>;
