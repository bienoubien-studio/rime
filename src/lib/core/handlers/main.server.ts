import type { BuiltConfig } from '$lib/core/config/types.js';
import { logger } from '$lib/core/logger/index.server.js';
import { type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import cloneDeep from 'clone-deep';
import cms from '../cms.server.js';
import { Rizom } from '../rizom.server.js';

const dev = process.env.NODE_ENV === 'development';

type Args = { config: BuiltConfig; schema: any };

export function createCMSHandler({ config, schema }: Args) {
	// CMS Handler :
	// Initialize Main Singleton
	// Create rizom object with main.config and main.adapter
	// Return the better-auth handler
	const handleCMS: Handle = async ({ event, resolve }) => {
		logger.info(`${event.request.method} ${event.url.pathname}`);

		if (dev || !cms.initialized) {
			const configCopy = cloneDeep(config);
			await cms.init({ config: configCopy, schema });
		}

		const rizom = new Rizom({ config: cms.config, adapter: cms.adapter, event });
		event.locals.rizom = rizom;

		return svelteKitHandler({ event, resolve, auth: cms.adapter.auth.betterAuth });
	};

	return handleCMS;
}
