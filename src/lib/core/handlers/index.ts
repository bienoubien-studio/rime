import { handleAuth } from './auth.server.js';
import { createCMSHandler } from './main.server.js';
import { handleRoutes } from './routes.server.js';
import type { Config } from '$lib/core/config/types/index.js';
import { createPluginsHandler } from './plugins.server.js';

type Args = { config: Config; schema: any };
export default function (args: Args) {
	return [
		createCMSHandler(args),
		handleAuth,
		// handleCORS,
		handleRoutes,
		...createPluginsHandler({ config: args.config })
	];
}
