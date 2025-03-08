import { dev } from '$app/environment';
import { error, fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server';
import { RizomError, RizomFormError } from 'rizom/errors/index.js';
import type { PanelActionFailure } from 'rizom/types/panel';
import { safe } from 'rizom/util/safe';

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

		const [error, success] = await safe(rizom.auth.login({ email, password, slug: 'users' }));

		if (error) {
			return handleError(error, { context: 'action', formData: { email } });
		}

		const setCookieHeader = success.response.headers.get('set-cookie');

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
