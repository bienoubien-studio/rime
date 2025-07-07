import { dev } from '$app/environment';
import { redirect, type Actions } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server.js';
import { RizomFormError } from '$lib/core/errors/index.js';

export const signInActions: Actions = {
	default: async ({ cookies, request, locals }) => {
		const { rizom } = locals;

		const data = await request.formData();
		const email = data.get('email')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		const response = await rizom.auth.betterAuth.api.signInEmail({
			body: { email, password },
			asResponse: true
		});

		const authenticated = response && response.status === 200;

		if (!authenticated) {
			return handleError(
				new RizomFormError({
					_form: RizomFormError.INVALID_CREDENTIALS,
					email: RizomFormError.INVALID_CREDENTIALS,
					password: RizomFormError.INVALID_CREDENTIALS
				}),
				{
					context: 'action',
					formData: { email }
				}
			);
		}

		const setCookieHeader = response.headers.get('set-cookie') as string;

		if (setCookieHeader) {
			const parsedCookie = setCookieHeader.split(';')[0];
			const [name, encodedValue] = parsedCookie.split('=');
			const decodedValue = decodeURIComponent(encodedValue);
			
			cookies.set(name, decodedValue, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 604800,
				secure: !dev
			});
		}

		throw redirect(302, '/panel');
	}
};
