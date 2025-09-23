import type { BuiltConfig } from '../config/types.js';
import { handleAuth } from './auth.server.js';
import { createCMSHandler } from './main.server.js';
import { createPluginsHandler } from './plugins.server.js';
import { handleRoutes } from './routes.server.js';

type Args = { config: BuiltConfig; schema: any };
export default function (args: Args) {
	return [
		createCMSHandler(args),
		handleAuth,
		// handleCORS,
		handleRoutes,
		...createPluginsHandler({ config: args.config })
	];
}
