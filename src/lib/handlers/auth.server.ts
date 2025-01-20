import { error, redirect, type Handle } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types';

export const handleAuth: Handle = async ({ event, resolve }) => {
	const rizom = event.locals.rizom;

	let authenticated = await rizom.auth.betterAuth.api.getSession({
		headers: event.request.headers
	});

	//////////////////////////////////////////////
	// Init if no admin users
	//////////////////////////////////////////////
	if (event.url.pathname.startsWith('/panel')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length === 0) {
			throw redirect(303, '/init');
		}
		if (!authenticated) {
			throw redirect(303, '/login');
		}
	}

	if (event.url.pathname.startsWith('/init')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length > 0) {
			throw error(404);
		}
	}

	if (!authenticated) {
		event.locals.user = undefined;
		event.locals.session = undefined;
		return resolve(event);
	}

	const { session, user: authUser } = authenticated;

	console.log(authenticated);

	const user = authUser
		? await rizom.auth.getUserAttributes({
				authUserId: authUser?.id,
				slug: authUser?.table as PrototypeSlug
			})
		: undefined;

	event.locals.user = user;
	event.locals.session = session || undefined;

	//
	if (event.url.pathname.startsWith('/panel')) {
		if (!user) {
			return redirect(302, '/login');
		}
		const authorized = rizom.config.raw.panel?.access?.(user);
		if (!authorized) {
			throw error(401, 'unauthorized');
		}
	}

	return resolve(event);
};
