import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { type CookieAttributes } from 'lucia';

import {
	RizomLoginEmailError,
	RizomLoginError,
	RizomLoginLockedError,
	RizomLoginPasswordError
} from '$lib/errors/login.server.js';
import type { PanelActionFailure } from 'rizom/types/panel';

type LoginForm = {
	email?: string;
	password?: string;
};

type LoginActionFailure = PanelActionFailure<LoginForm>;

export const loginActions = {
	default: async ({ cookies, request, locals }: RequestEvent) => {
		const { rizom } = locals;

		const data = await request.formData();
		const email = data.get('email') as string | undefined;
		const password = data.get('password') as string | undefined;

		try {
			const { session } = await rizom.auth.login({ email, password, slug: 'users' });
			const sessionCookie = rizom.auth.lucia.createSessionCookie(session.id);
			locals.session = session;
			const { name, value, attributes } = sessionCookie;
			cookies.set(name, value, attributes as CookieAttributes & { path: string });
		} catch (err: any) {
			console.log(err);
			if (err instanceof RizomLoginEmailError) {
				return fail<LoginActionFailure>(400, { form: { email }, errors: { email: err.message } });
			}
			if (err instanceof RizomLoginPasswordError) {
				return fail<LoginActionFailure>(400, {
					form: { email },
					errors: { password: err.message }
				});
			}
			if (err instanceof RizomLoginLockedError) {
				throw redirect(302, '/locked');
			}
			if (err instanceof RizomLoginError) {
				return fail<LoginActionFailure>(400, {
					form: { email },
					errors: { email: err.message, password: err.message }
				});
			}
			return fail<LoginActionFailure>(500, { error: 'Could not login user.' });
		}

		throw redirect(302, '/panel');
	}
};
