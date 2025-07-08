import { error, redirect, type Handle } from '@sveltejs/kit';
import { RizomError } from '$lib/core/errors/index.js';
import type { CollectionSlug, PrototypeSlug } from '$lib/core/types/doc.js';
import { BETTER_AUTH_ROLES } from '../collections/auth/constant.server.js';
import { logger } from '../logger/index.server.js';
import { prompt } from '../dev/cli/util.server.js';

const dev = process.env.NODE_ENV === 'development';

// Validate the session
// retrieve user attributes
// check for panel access
export const handleAuth: Handle = async ({ event, resolve }) => {
	const rizom = event.locals.rizom;
	
	const isSignInRoute = event.url.pathname === '/panel/sign-in';
	const isPanelRoute = event.url.pathname.startsWith('/panel') && !isSignInRoute;
	
	// Authenticate
	const authenticated = await rizom.auth.betterAuth.api.getSession({
		headers: event.request.headers
	});
	
	// for /panel request
	if (isPanelRoute) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length === 0 && !dev) {
			throw new RizomError(RizomError.NOT_FOUND);
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

	
	// Get user attributes
	const { session, user: authUser } = authenticated;
	
	// Get CMS user attributes
	const user = await rizom.auth.getUserAttributes({
		authUserId: authUser.id,
		slug: authUser.type as CollectionSlug
	});
	
	// If the user doesn't exsits, there is no associated CMS user
	// to the current better-auth account, this should never happend
	if (!user) {
		logger.error(RizomError.UNAUTHORIZED);
		throw error(401, RizomError.UNAUTHORIZED);
	}
	
	// Check admin roles on both better-auth and user attributes
	if (user.roles.includes('admin') && authUser.role !== BETTER_AUTH_ROLES.ADMIN) {
		logger.error(RizomError.UNAUTHORIZED);
		throw error(401, RizomError.UNAUTHORIZED);
	}
	
	// Forward API_KEY role if it's an api-key authentication
	const apiKey = event.request.headers.get('x-api-key') || null
	if(apiKey){
		// get the api key informations
		const result = await rizom.auth.betterAuth.api.verifyApiKey({
			body: {
				key: apiKey
			},
		});
		// If valid then forward roles to the authenticated user
		if (result.valid && result.key && typeof result.key.permissions === 'string') {
			const permissions = JSON.parse(result.key.permissions)
			user.roles = permissions.roles
		} else {
			logger.error(RizomError.UNAUTHORIZED, 'Invalid api key');
			throw error(401, RizomError.UNAUTHORIZED);
		}
	}
	
	// Populate locals
	event.locals.user = user;
	event.locals.session = session || undefined;
	event.locals.betterAuthUser = authUser

	// Check if a user has the proper role
	// to visit the panel
	if (isPanelRoute) {
		
		// Check that panel access is from a staff authenticated user
		if (!user.isStaff) {
			logger.error(RizomError.UNAUTHORIZED);
			throw error(401, RizomError.UNAUTHORIZED);
		}

		// Check that this staff user have access to panel
		if (!rizom.config.raw.panel.access(user)) {
			logger.error(RizomError.UNAUTHORIZED);
			throw error(401, RizomError.UNAUTHORIZED);
		}

	}

	
	return resolve(event);
};
