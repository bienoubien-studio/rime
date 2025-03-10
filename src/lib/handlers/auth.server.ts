import { error, redirect, type Handle } from '@sveltejs/kit';
import { RizomError } from 'rizom/errors/index.js';
import type { PrototypeSlug } from 'rizom/types';

const dev = process.env.NODE_ENV === 'development';

// Validate the session
// retrieve user attributes
// check for panel access
export const handleAuth: Handle = async ({ event, resolve }) => {
	const rizom = event.locals.rizom;

	// Authenticate
	let authenticated = await rizom.auth.betterAuth.api.getSession({
		headers: event.request.headers
	});

	// Redirect to the proper route

	// for /panel request
	if (event.url.pathname.startsWith('/panel')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length === 0) {
			if (!dev) {
				throw new RizomError(RizomError.FIRST_USER_DEV);
			}
			throw redirect(303, '/init');
		}
		if (!authenticated) {
			throw redirect(303, '/login');
		}
	}

	// Handle /init route, if no authUsers allow
	// or throw a 404 if there is at least one
	if (event.url.pathname.startsWith('/init')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length > 0) {
			throw error(404);
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
	const user = await rizom.auth.getUserAttributes({
		authUserId: authUser.id,
		slug: authUser.table as PrototypeSlug
	});

	if (!user) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Check admin roles on both better-auth and user attributes
	if (user.roles.includes('admin') && authUser.role !== 'admin') {
		throw error(401, RizomError.UNAUTHORIZED);
	}

	// Populate locals
	event.locals.user = user;
	event.locals.session = session || undefined;

	// Check if a user has the proper role
	// to visit the panel
	if (event.url.pathname.startsWith('/panel')) {
		const authorized = rizom.config.raw.panel.access(user);
		if (!authorized) {
			throw error(401, RizomError.UNAUTHORIZED);
		}
	}

	return resolve(event);
};
