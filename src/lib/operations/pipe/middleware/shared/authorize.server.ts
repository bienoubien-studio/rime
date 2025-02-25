import { RizomError } from 'rizom/errors';
import type { Middleware } from '../../index.server';

export const authorize: Middleware<any> = async (ctx, next) => {
	const { user } = ctx.event.locals;
	const authorized = ctx.config.access.read(user);
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	await next();
};
