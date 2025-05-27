import { redirect, type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import { handleError } from '$lib/core/errors/handler.server';

export const initActions = {
	default: async ({ request, locals }: RequestEvent) => {
		const { rizom } = locals;

		const data = await extractData(request);
		try {
			const { email, name, password } = data;
			await rizom.createFirstPanelUser({ email, name, password });
			throw redirect(302, '/panel/login');
		} catch (err: any) {
			return handleError(err, {
				context: 'action',
				formData: { email: data.email }
			});
		}
	}
};
