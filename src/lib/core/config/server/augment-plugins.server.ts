import { dev } from '$app/environment';
import type { Config } from '$lib/core/config/types.js';
import { apiInit } from '$lib/core/plugins/api-init/index.server.js';
import { cache } from '$lib/core/plugins/cache/index.server.js';
import { mailer } from '$lib/core/plugins/mailer/index.server.js';
import { sse } from '$lib/core/plugins/sse/index.server.js';
import type { Plugin } from '$lib/types.js';
import { hasProp } from '$lib/util/object';

export type WithPluginsServer<T> = T & { $plugins: ReturnType<Plugin>[] };

export const augmentPluginsServer = <const T extends Config>(config: T): WithPluginsServer<T> => {
	//
	const corePluginsServer = [
		// Cache plugin with default isEnabled : event => !event.locals.user
		cache(config.$cache || {}),
		// Server Sent Event
		sse(),
		// Add init plugins in dev mode
		...(dev ? [apiInit()] : []),
		// Mailer plugin
		...(hasProp('$smtp', config) ? [mailer(config.$smtp)] : [])
	];

	const plugins = [...corePluginsServer, ...(config.$plugins || [])];

	for (const plugin of plugins) {
		if ('configure' in plugin && typeof plugin.configure === 'function') {
			config = plugin.configure(config);
		}

		// Register routes
		if ('routes' in plugin && typeof plugin.routes === 'object') {
			config.$routes = {
				...(config.$routes || {}),
				...plugin.routes
			};
		}
	}

	return {
		...config,
		$plugins: config.plugins || []
	} as const;
};
