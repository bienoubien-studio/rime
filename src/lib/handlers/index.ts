import { handleAuth } from './auth.server.js';
import { createCMSHandler } from './rizom.server.js';
import { handleCORS } from './cors.server.js';
import { handleRoutes } from './routes.server.js';
import type { Config } from 'rizom/types/index.js';
import { createPluginsHandler } from './plugins.server.js';

export default function (args: Args) {
	return [
		createCMSHandler(args),
		handleAuth,
		handleRoutes,
		...createPluginsHandler({ config: args.config })
	];
}

type Args = { config: Config; schema: any };
