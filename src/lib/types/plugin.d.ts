import type { BuiltConfig, RouteConfig } from './config';

type MaybeAsyncFunction = (...args: any[]) => any | Promise<any>;

export type Plugin<TArgs extends Dic = Dic> = (options: TArgs) => {
	name: string;
	configure?: (config: BuiltConfig) => BuiltConfig;
	actions?: Record<string, MaybeAsyncFunction>;
	routes?: Record<string, RouteConfig>;
};

export type MailerPlugin = {
	options: { from: string }; // Only include what you need
	sendMail: (args: {
		from: string;
		to: string;
		subject: string;
		text: string;
		html: string;
	}) => Promise<any>;
};
