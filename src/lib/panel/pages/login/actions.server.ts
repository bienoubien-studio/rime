import { dev } from '$app/environment';
import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import type { PanelActionFailure } from 'rizom/types/panel';

type LoginForm = {
	email?: string;
	password?: string;
};

type LoginActionFailure = PanelActionFailure<LoginForm>;

export const loginActions: Actions = {
	default: async ({ cookies, request, locals }) => {
		const { rizom } = locals;

		const data = await request.formData();
		const email = data.get('email')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		try {
			const { response } = await rizom.auth.login({ email, password, slug: 'users' });

			const setCookieHeader = response.headers.get('set-cookie');
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
		} catch (err: any) {
			console.log(err);
			return fail<LoginActionFailure>(500, { error: 'Could not login user.' });
		}

		throw redirect(302, '/panel');
	}
};
