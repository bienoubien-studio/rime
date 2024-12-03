import { error, redirect, type Handle } from '@sveltejs/kit';

export const handleAuth: Handle = async ({ event, resolve }) => {
	const rizom = event.locals.rizom;
	let sessionId = event.cookies.get(rizom.auth.lucia.sessionCookieName);

	//////////////////////////////////////////////
	// Init if no admin users
	//////////////////////////////////////////////
	if (event.url.pathname.startsWith('/panel')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length === 0) {
			throw redirect(303, '/init');
		}
		if (!sessionId) {
			throw redirect(303, '/login');
		}
	}

	if (event.url.pathname.startsWith('/init')) {
		const users = await rizom.auth.getAuthUsers();
		if (users.length > 0) {
			throw error(404);
		}
	}

	//////////////////////////////////////////////
	// Try getting sessionId if not defined
	//////////////////////////////////////////////

	if (!sessionId && event.url.pathname.startsWith('/api')) {
		const authorizationHeader = event.request.headers.get('Authorization');
		sessionId = rizom.auth.lucia.readBearerToken(authorizationHeader ?? '') || undefined;
	}

	if (!sessionId) {
		event.locals.user = undefined;
		event.locals.session = undefined;
		return resolve(event);
	}

	const { session, user: authUser } = await rizom.auth.lucia.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = rizom.auth.lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = rizom.auth.lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	const user = authUser
		? await rizom.auth.getUserAttributes({
				authUserId: authUser?.id,
				slug: authUser?.table
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
