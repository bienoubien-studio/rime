import { type Handle } from '@sveltejs/kit';
import cms from '../cms.server.js';
import { logger } from '$lib/core/logger/index.server.js';
import { Rizom } from '../rizom.server.js';
import type { Config } from '$lib/core/config/types/index.js';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import cloneDeep from 'clone-deep';

const dev = process.env.NODE_ENV === 'development';

type Args = { config: Config; schema: any };

export function createCMSHandler({ config, schema }: Args) {
	// CMS Handler :
	// Initialize Main Singleton
	// Create rizom object with main.config and main.adapter
	// Return the better-auth handler
	const handleCMS: Handle = async ({ event, resolve }) => {
		logger.info(`${event.request.method} ${event.url.pathname}`);

		if (dev || !cms.initialized) {
			const configCopy = cloneDeep(config) 
			await cms.init({ config: configCopy, schema });
		}
		
		const rizom = new Rizom({ config: cms.config, adapter: cms.adapter, event });
		event.locals.rizom = rizom;

		return svelteKitHandler({ event, resolve, auth: cms.adapter.auth.betterAuth });
	};

	return handleCMS;
}
