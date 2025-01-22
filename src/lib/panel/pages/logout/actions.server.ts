import { fail, redirect, type RequestEvent } from '@sveltejs/kit';

export const logout = async ({ request, locals }: RequestEvent) => {
	const { rizom } = locals;
	if (!locals.session) {
		return fail(400);
	}

	await rizom.auth.betterAuth.api.revokeSession({
		body: {
			token: locals.session.token
		},
		headers: request.headers
	});

	redirect(302, '/login');
};
