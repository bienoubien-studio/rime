import { email as validateEmail, password as validatePassword } from '$lib/util/validate.js';
import { dev } from '$app/environment';
import { handleError } from '$lib/core/errors/handler.server.js';
import { RizomError, RizomFormError } from '$lib/core/errors/index.js';
import { extractData } from '$lib/core/operations/extract-data.server.js';
import type { FormErrors, Plugin } from '$lib/types';
import { trycatch, trycatchSync } from '$lib/util/trycatch.js';
import { json, type RequestHandler } from '@sveltejs/kit';
import { PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';

export const apiInit: Plugin<never> = () => {
	const requestHandler: RequestHandler = async (event) => {
		
    if (!dev) throw new RizomError(RizomError.NOT_FOUND);
		
    const users = await event.locals.rizom.auth.getAuthUsers();
		if (users.length > 0 || (users.length === 0 && !dev)) {
      throw handleError(new RizomError(RizomError.NOT_FOUND), { context: 'api' })
		}
    
		const data = await extractData<Record<string, string>>(event.request);
    const [error, _] = trycatchSync(() => validateForm(data));

		if (error) {
			throw handleError(error, {
				context: 'action',
				formData: { email: data.email }
			});
		}

		event.locals.isInit = true;

		const [signUpError, __] = await trycatch(() =>
			event.locals.rizom.auth.betterAuth.api.signUpEmail({
				body: {
					email: data.email,
					name: data.name,
					password: data.password,
					type: PANEL_USERS
				}
			})
		);
    
		if (signUpError) {
			throw handleError(signUpError, {
				context: 'api',
				formData: { email: data.email }
			});
		}

		return json({ initialized: true });
	};

	return {
		name: 'apiInit',
		core: true,
		routes: {
			'/api/init': {
				POST: requestHandler
			}
		}
	};
};

const validateForm = (data: Record<string, string>): data is { email: string; name: string; password: string } => {
	let errors: FormErrors = {};
	const { name, email, password } = data;

	if (!email) {
		errors.email = RizomFormError.REQUIRED_FIELD;
	}
	if (!name) {
		errors.name = RizomFormError.REQUIRED_FIELD;
	}
	if (!password) {
		errors.password = RizomFormError.REQUIRED_FIELD;
	}

	const emailValidation = validateEmail(email);
	if (typeof emailValidation === 'string') {
		errors.email = RizomFormError.INVALID_FIELD;
	}

	if (typeof name !== 'string') {
		errors.name = RizomFormError.INVALID_FIELD;
	}

	const passwordValidation = validatePassword(password);
	if (typeof passwordValidation === 'string') {
		errors.name = RizomFormError.INVALID_FIELD;
	}

	if (Object.keys(errors).length > 0) {
		throw new RizomFormError(errors);
	}

	return true;
};
