import { type Handle } from '@sveltejs/kit';
import rizom from '../rizom.server.js';
import { requestLogger, taskLogger } from 'rizom/utils/logger/index.js';
import { dev } from '$app/environment';
import { LocalAPI } from '../operations/localAPI/index.server.js';
import type { Config } from 'rizom/types/index.js';

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

type Args = { config: Config; schema: any };

export function createCMSHandler({ config, schema }: Args) {
	const handleCMS: Handle = async ({ event, resolve }) => {
		requestLogger.info(event.request.method + ' ' + event.url.pathname);

		if (dev || !rizom.initialized) {
			await rizom.init({ config, schema });
		}

		while (!rizom.initialized) {
			taskLogger.info('waiting for rizom initialization');
			await sleep(200);
		}

		event.locals.api = new LocalAPI({ rizom, event });
		event.locals.rizom = rizom;
		event.locals.locale = rizom.defineLocale({ event });

		return resolve(event);
	};

	return handleCMS;
}
