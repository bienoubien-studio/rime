import validate from '$lib/utils/validate.js';
import logger from '$lib/logger/index.js';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { PanelActionFailure } from 'rizom/types/panel';

type ForgotPasswordForm = {
	email?: string;
};

type ForgotPasswordActionFailure = PanelActionFailure<ForgotPasswordForm>;

export const forgotPasswordActions = {
	default: async ({ request, url, fetch }: RequestEvent) => {
		const data = await request.formData();
		const email = (data.get('email') as string) || undefined;
		const hasParams = url.searchParams.toString() !== '';

		if (!email) {
			return fail<ForgotPasswordActionFailure>(400, {
				errors: { email: 'email is required' }
			});
		}

		const validationResult = validate.email(email as string);
		if (typeof validationResult === 'string') {
			return fail<ForgotPasswordActionFailure>(400, {
				form: { email },
				errors: { email: validationResult }
			});
		}

		if (!hasParams) {
			return fail<ForgotPasswordActionFailure>(400, { error: 'invalid data' });
		}

		const slug = url.searchParams.get('slug');

		try {
			await fetch(`/api/${slug}/forgot-password`, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					email
				})
			}).then((r) => r.json());
		} catch (err: any) {
			logger.error(err.message);
			return fail<ForgotPasswordActionFailure>(500, { error: err.message });
		}
		return { success: true };
	}
};
