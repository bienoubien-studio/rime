import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { RizomError, RizomFormError } from './index.js';
import { logger } from '$lib/core/logger/index.server.js';
import { getRequestEvent } from '$app/server';
import { APIError } from 'better-auth/api';

export const ERROR_CONTEXT = {
	ACTION: 'action',
	API: 'api',
	LOAD: 'load',
	HANDLER: 'handler'
} as const;

export type ErrorContext = (typeof ERROR_CONTEXT)[keyof typeof ERROR_CONTEXT];

type ErrorHandlerOptions = {
	context: ErrorContext;
	formData?: Record<string, any>; // For actions
};

export function handleError(err: Error, options: ErrorHandlerOptions) {
	const { context, formData } = options;

	/****************************************************/
	/* FormError Errors
	/****************************************************/
	if (err instanceof RizomFormError) {
		switch (context) {
			case ERROR_CONTEXT.ACTION:
				return fail(400, {
					form: formData || {},
					errors: err.errors
				});
			case ERROR_CONTEXT.API:
				return error(400, err.message);
		}
	}

	/****************************************************/
	/* Rizom Errors 
	/****************************************************/
	if (err instanceof RizomError) {
		if (err.code === RizomError.NOT_FOUND && context === ERROR_CONTEXT.LOAD) {
			const event = getRequestEvent();
			logger.error(`404 - ${err.message} - ${event.url.href}`);
			throw error(404, event.url.href + ' : ' + err.message);
		}
		const logMessage = err.message ? `${err.status} — ${err.message}` : err.status;
		logger.error(logMessage);
		return error(err.status, err.message);
	}

	// Redirect error
	if (isRedirect(err)) {
		return redirect(err.status, err.location);
	}

	/****************************************************/
	/* Handle BetterAuth error
	/****************************************************/
	if (err instanceof APIError) {
		if (err.body?.code === 'USER_ALREADY_EXISTS') {
			switch (context) {
				case ERROR_CONTEXT.ACTION:
					return fail(400, {
						form: formData || {},
						errors: {
							email: RizomFormError.UNIQUE_FIELD
						}
					});
				case ERROR_CONTEXT.API:
					logger.debug(`400 — ${err.body.message}`);
					return error(400, err.message);
			}
		}

		const message = `${err.body?.message || err.message || err.status}`;
		logger.debug(err)
		
		switch (context) {
			case ERROR_CONTEXT.ACTION:
				return fail(err.statusCode, {
					form: {},
					errors: {
						_form: message
					}
				});

			case ERROR_CONTEXT.API:
				logger.debug(`401 — ${message}`);
				return error(401, message);
		}
	}

	// Unknown errors
	console.error(err);
	const event = getRequestEvent();
	const logMessage = err.message ? `500 - ${event.url.href} - ${err.message}` : `500 - ${event.url.href}`;
	logger.error(logMessage);
	return error(500, 'Internal Server Error');
}
