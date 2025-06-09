import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { RizomError, RizomFormError } from './index.js';
import { logger } from '$lib/core/logger/index.server.js';

export const ERROR_CONTEXT = {
  ACTION: "action",
  API: "api",
  load: "load"
} as const;

export type ErrorContext = typeof ERROR_CONTEXT[keyof typeof ERROR_CONTEXT];

type ErrorHandlerOptions = {
	context: ErrorContext;
	formData?: Record<string, any>; // For actions
};

export function handleError(err: Error, options: ErrorHandlerOptions) {
	const { context, formData } = options;

	if (err instanceof RizomFormError) {
		switch (context) {
			case 'action':
				return fail(400, {
					form: formData || {},
					errors: err.errors
				});
			case 'api':
				return error(400, err.message);
			// case 'load':
			// 	return error(400, err.errors);
		}
	}

	if (err instanceof RizomError) {
		if (err.code === RizomError.USER_BANNED && context === 'action') {
			throw redirect(302, '/locked');
		}

		if (err.code === RizomError.NOT_FOUND && context === 'load') {
			throw error(404, err.message);
		}

		logger.error(`${err.status} — ${err.message}`);
		return error(err.status, err.message);
	}

	// Redirect error
	if (isRedirect(err)) {
		return redirect(err.status, err.location);
	}

	// Unknown errors
	console.error(err)
	logger.error(`500 - ${err.message}`);

	return error(500, 'Internal Server Error');
}
