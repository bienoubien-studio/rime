import { fail, redirect, type RequestEvent } from '@sveltejs/kit';

export const logout = async ({ cookies, locals }: RequestEvent) => {
	const { rizom } = locals;
	if (!locals.session) {
		return fail(400);
	}
	await rizom.auth.lucia.invalidateSession(locals.session.id);
	const sessionCookie = rizom.auth.lucia.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	redirect(302, '/login');
};
