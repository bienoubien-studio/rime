import validate from '$lib/utils/validate.js';
import { RizomInitError } from '$lib/errors/init.server.js';
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { PanelActionFailure } from 'rizom/types/panel';
import extractData from 'rizom/operations/preprocess/extract/data.server';

type InitForm = {
	email?: string;
	password?: string;
};

type InitActionFailure = PanelActionFailure<InitForm>;

export const initActions = {
	default: async ({ request, locals }: RequestEvent) => {
		const { rizom } = locals;

		const { email, password, name } = await extractData(request);

		const emailValidationResult = validate.email(email);
		if (typeof emailValidationResult === 'string') {
			return fail<InitActionFailure>(400, {
				form: { email },
				errors: { email: emailValidationResult }
			});
		}

		const passwordValidationResult = validate.password(password);
		if (typeof passwordValidationResult === 'string') {
			return fail<InitActionFailure>(400, {
				form: { email },
				errors: { password: passwordValidationResult }
			});
		}

		try {
			await rizom.auth.createFirstUser({ name, email, password });
		} catch (err: any) {
			if (err instanceof RizomInitError) {
				return error(404);
			}
			console.error(err);
			return error(500, { message: 'Could not register user' });
		}
		throw redirect(302, '/panel/login');
	}
};
