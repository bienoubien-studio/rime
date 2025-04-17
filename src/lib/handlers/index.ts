import { handleAuth } from './auth.server.js';
import { createCMSHandler } from './rizom.server.js';
import { handleRoutes } from './routes.server.js';
import type { Config } from '$lib/types/index.js';
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
