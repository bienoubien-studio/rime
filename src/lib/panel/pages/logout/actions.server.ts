import { fail, redirect, type Actions } from '@sveltejs/kit';

export const logoutActions: Actions = {
	default: async ({ request, locals }) => {
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
	}
};
