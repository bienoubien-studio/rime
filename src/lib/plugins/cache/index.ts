import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { Cache } from './cache.server.js';
import type { Plugin } from 'rizom';
import { handler } from './handler.server.js';
import { toHash } from 'rizom/utils/string.js';
import HeaderButton from './HeaderButton.svelte';

type Enabled = (event: RequestEvent) => boolean;
type CacheArgs = { isEnabled?: Enabled };
type Actions = {
	get: <T>(name: string, get: () => Promise<T>) => Promise<T>;
	clear: () => ReturnType<RequestHandler>;
	isEnabled: Enabled;
	toHashKey: (...params: unknown[]) => string;
};

export const cache: Plugin<CacheArgs> = (options) => {
	async function getAction<T>(key: string, get: () => Promise<T>): Promise<T> {
		return await Cache.get<T>(key, get);
	}

	const clearCache = () => {
		Cache.clear();
		return json({ message: 'Cache cleared' });
	};

	const actions: Actions = {
		get: getAction,
		clear: clearCache,
		toHashKey: (...params) =>
			toHash(params.map((param) => (param ? param.toString() : '')).join('-')),
		isEnabled: options?.isEnabled || ((event) => !event.locals.user)
	};

	return {
		name: 'cache',

		configure: (config) => {
			config = {
				...config,
				panel: {
					...(config.panel || {}),
					components: {
						...(config.panel.components || { header: [], collectionHeader: [] }),
						header: [...(config.panel.components?.header || []), HeaderButton]
					}
					// routes: {
					// 	...(config.panel.routes || {}),
					// 	cache: {
					// 		group: 'system',
					// 		label: 'Cache',
					// 		icon: DatabaseZapIcon,
					// 		component: Settings
					// 	}
					// }
				}
			};
			return config;
		},
		routes: {
			'/api/clear-cache': {
				POST: clearCache
			}
		},

		actions,
		handler
	};
};

declare module 'rizom' {
	interface RegisterPlugins {
		cache: Actions;
	}
}
