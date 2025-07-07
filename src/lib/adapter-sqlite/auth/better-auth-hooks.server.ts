import { getRequestEvent } from '$app/server';
import { omit } from '$lib/util/object.js';
import { trycatch } from '$lib/util/trycatch.js';
import { createAuthMiddleware, type AuthMiddleware } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { BETTER_AUTH_ROLES } from '$lib/core/collections/auth/constant.server.js';
import { dev } from '$app/environment';
import { logger } from '$lib/core/logger/index.server.js';
import { APIError } from 'better-auth/api';

/**
 * After any Better-Auth endpoint call
 */
export const betterAuthAfterHook: AuthMiddleware = createAuthMiddleware(async (ctx) => {
	/****************************************************/
	/* Handle sign-in 
	/****************************************************/
	if (ctx.path.startsWith('/sign-in')) {
		const newSession = ctx.context.newSession;

		if (newSession) {
			const event = getRequestEvent();
			const user = await event.locals.rizom.auth.getUserAttributes({
				authUserId: newSession.user.id,
				slug: newSession.user.type
			});
			if (!user) {
				logger.error(`cant' find user with authUser id ${newSession.user.id} from ${newSession.user.type} collection`)
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request'
				});
			}
			return ctx.json({
				user: {
					email: user.email,
					name: user.name,
					id: user.id
				}
			});
		}
	}

	/****************************************************/
	/* Handle sign-up 
	/****************************************************/
	if (ctx.path.startsWith('/sign-up')) {
		const newSession = ctx.context.newSession;

		const event = getRequestEvent();

		if (!newSession) {
			return;
		}

		let data = ctx.body;

		if (event.locals.isInit && dev) {
			const { authUsers } = event.locals.rizom.adapter.tables;

			await event.locals.rizom.adapter.db
				.update(authUsers)
				.set({
					role: BETTER_AUTH_ROLES.ADMIN
				})
				.where(eq(authUsers.id, newSession.user.id));

			event.locals.user = {
				id: '1',
				name: 'system',
				email: 'admin@system.com',
				roles: ['admin'],
				isSuperAdmin: true
			};

			data.isSuperAdmin = true;
		}

		/**
		 * Set isAutoSignIn flag to true to auto-populate the user document
		 * after creation on event.locals.user
		 */
		event.locals.isAutoSignIn = true;

		const [error, _] = await trycatch(
			event.locals.rizom
				.collection(ctx.body.type)
				.system(event.locals.isInit)
				.create({
					data: {
						...omit(['password', 'type'], ctx.body),
						roles: ['admin'],
						authUserId: newSession.user.id
					}
				})
		);

		// If error clean up session/account/user created
		// Would be great to do it with the admin plugin,
		// TODO maybe generate a superadmin API-KEY stored on server
		if (error && newSession) {
			logger.error(error.message);
			const { user } = newSession;
			const event = getRequestEvent();
			const { rizom } = event.locals;
			const sessionTable = rizom.adapter.tables.authSessions;
			const authAccountsTable = rizom.adapter.tables.authAccounts;
			const authUsersTable = rizom.adapter.tables.authUsers;
			await rizom.adapter.db.delete(sessionTable).where(eq(sessionTable.userId, user.id));
			await rizom.adapter.db.delete(authAccountsTable).where(eq(authAccountsTable.userId, user.id));
			await rizom.adapter.db.delete(authUsersTable).where(eq(authUsersTable.id, user.id));
		}
	}
});
