import { RizomError } from 'rizom/errors';
import type { Middleware } from '../../index.server';

export const authorize: Middleware = async (ctx, next) => {
	const { user } = ctx.event.locals;
	const authorized = ctx.config.access[ctx.operation](user, { id: ctx.data?.id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	await next();
};
