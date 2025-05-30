import { json, type RequestEvent, type RequestHandler } from '@sveltejs/kit';
import { Cache } from './cache.server.js';
import type { Plugin } from '$lib/types';
import { handler } from './handler.server.js';
import { toHash } from '$lib/util/string.js';
import HeaderButton from './HeaderButton.svelte';

export type CacheActions = {
	get: <T>(name: string, get: () => Promise<T>) => Promise<T>;
	clear: () => ReturnType<RequestHandler>;
	isEnabled: Enabled;
	toHashKey: (...params: unknown[]) => string;
};

type Enabled = (event: RequestEvent) => boolean;
type CacheOptions = { isEnabled?: Enabled };

export const cache: Plugin<CacheOptions> = (options) => {
	async function getAction<T>(key: string, get: () => Promise<T>): Promise<T> {
		return await Cache.get<T>(key, get);
	}

	const clearCache = () => {
		Cache.clear();
		return json({ message: 'Cache cleared' });
	};

	const actions: CacheActions = {
		get: getAction,
		clear: clearCache,
		toHashKey: (...params) =>
			toHash(params.map((param) => (param ? param.toString() : '')).join('-')),
		isEnabled: options?.isEnabled || ((event) => !event.locals.user)
	};

	
	return {
		name: 'cache',
		core: true,
		configure: (config) => {
			config = {
				...config,
				panel: {
					...(config.panel || {}),
					components: {
						...(config.panel.components || { header: [], collectionHeader: [] }),
						header: [...(config.panel.components?.header || []), HeaderButton]
					}
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
