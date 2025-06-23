import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { RizomError, RizomFormError } from './index.js';
import { logger } from '$lib/core/logger/index.server.js';
import { getRequestEvent } from '$app/server';

export const ERROR_CONTEXT = {
	ACTION: 'action',
	API: 'api',
	load: 'load'
} as const;

export type ErrorContext = (typeof ERROR_CONTEXT)[keyof typeof ERROR_CONTEXT];

type ErrorHandlerOptions = {
	context: ErrorContext;
	formData?: Record<string, any>; // For actions
};

export function handleError(err: Error, options: ErrorHandlerOptions) {
	const { context, formData } = options;

	if (err instanceof RizomFormError) {
		switch (context) {
			case 'action':
				logger.debug(`400 — ${err.message}`);
				return fail(400, {
					form: formData || {},
					errors: err.errors
				});
			case 'api':
				logger.debug(`400 — ${err.message}`);
				return error(400, err.message);
		}
	}
	
	if (err instanceof RizomError) {
		
		if (err.code === RizomError.NOT_FOUND && context === 'load') {
			const event = getRequestEvent()
			logger.error(`404 - ${event.url.href}`);
			throw error(404, event.url.href + ' : ' + err.message);
		}

		logger.error(`${err.status} — ${err.message}`);
		return error(err.status, err.message);
	}

	// Redirect error
	if (isRedirect(err)) {
		return redirect(err.status, err.location);
	}
	
	// Unknown errors
	console.error(err);
	const event = getRequestEvent()
	logger.error(`500 - ${event.url.href} - ${err.message}`);
	
	return error(500, 'Internal Server Error');
}
