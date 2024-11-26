import { error } from '@sveltejs/kit';
import { RizomAccessError } from 'rizom/errors/access';
import { RizomLoginError, RizomLoginLockedError } from 'rizom/errors/login.server';
import { RizomNotFoundError } from 'rizom/errors/notFound.server';
import logger from 'rizom/logger';

export function handleAPIError(err: any, serverErrorMessage?: string) {
	logger.error(err);
	if (err instanceof RizomAccessError) {
		return error(403, err.message);
	}
	if (err instanceof RizomNotFoundError) {
		return error(404, err.message);
	}
	if (err instanceof RizomLoginLockedError) {
		return error(403, err.message);
	}
	if (err instanceof RizomLoginError) {
		return error(400, err.message);
	}
	return error(500, serverErrorMessage || err.message);
}
