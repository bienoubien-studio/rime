import { RimeError } from '$lib/core/errors/index.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { BETTER_AUTH_ROLES } from '../collections/auth/constant.server.js';
import { logger } from '../logger/index.server.js';

const dev = process.env.NODE_ENV === 'development';

// Validate the session
// retrieve user attributes
// check for panel access
export const handleAuth: Handle = async ({ event, resolve }) => {
	const rime = event.locals.rime;

	const isSignInRoute = event.url.pathname === '/panel/sign-in';
	const isPanelRoute = event.url.pathname.startsWith('/panel') && !isSignInRoute;

	// Authenticate
	const authenticated = await rime.auth.betterAuth.api.getSession({
		headers: event.request.headers
	});

	// for /panel request
	if (isPanelRoute) {
		const users = await rime.auth.getAuthUsers();
		if (users.length === 0 && !dev) {
			throw new RimeError(RimeError.NOT_FOUND);
		}
		if (!authenticated) {
			throw redirect(303, '/panel/sign-in');
		}
	}

	// If not authenticated resolve
	// before getting user attributes
	if (!authenticated) {
		event.locals.user = undefined;
		event.locals.session = undefined;
		return resolve(event);
	}

	const { session, user: authUser } = authenticated;

	// Get CMS user attributes
	const user = await rime.auth.getUserAttributes({
		authUserId: authUser.id,
		slug: authUser.type as CollectionSlug
	});

	// Throw error if the user doesn't exsits, that means there is no associated CMS user
	// to the current better-auth account, this should never happend
	if (!user) {
		logger.error(RimeError.UNAUTHORIZED);
		throw error(401, RimeError.UNAUTHORIZED);
	}

	// Check admin roles on both better-auth and user attributes
	if (user.roles.includes('admin') && authUser.role !== BETTER_AUTH_ROLES.ADMIN) {
		logger.error(RimeError.UNAUTHORIZED);
		throw error(401, RimeError.UNAUTHORIZED);
	}

	// Forward API_KEY role if it's an api-key authentication
	const apiKey = event.request.headers.get('x-api-key') || null;
	if (apiKey) {
		// get the api key informations
		const result = await rime.auth.betterAuth.api.verifyApiKey({
			body: {
				key: apiKey
			}
		});
		// If valid then forward roles to the authenticated user
		if (result.valid && result.key && typeof result.key.permissions === 'string') {
			const permissions = JSON.parse(result.key.permissions);
			user.roles = permissions.roles;
		} else {
			logger.error(RimeError.UNAUTHORIZED, 'Invalid api key');
			throw error(401, RimeError.UNAUTHORIZED);
		}
	}

	// Populate locals
	event.locals.user = user;
	event.locals.session = session || undefined;
	event.locals.betterAuthUser = authUser;

	// Check if a user has the proper role
	// to visit the panel
	if (isPanelRoute) {
		// Check that panel access is from a staff authenticated user
		if (!user.isStaff) {
			logger.error(RimeError.UNAUTHORIZED);
			throw error(401, RimeError.UNAUTHORIZED);
		}

		// Check that this staff user have access to panel
		if (!rime.config.raw.panel.$access(user)) {
			logger.error(RimeError.UNAUTHORIZED);
			throw error(401, RimeError.UNAUTHORIZED);
		}
	}

	return resolve(event);
};
