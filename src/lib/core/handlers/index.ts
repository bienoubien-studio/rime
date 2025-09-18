import type { Config } from '$lib/core/config/types.js';
import { createCMSHandler } from './main.server.js';

type Args = { config: Config; schema: any };
export default function (args: Args) {
	return [
		createCMSHandler(args)
		// handleAuth,
		// handleCORS,
		// handleRoutes,
		// ...createPluginsHandler({ config: args.config })
	];
}
