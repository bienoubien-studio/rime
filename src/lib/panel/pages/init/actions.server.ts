import { redirect, type RequestEvent } from '@sveltejs/kit';
import extractData from 'rizom/operations/preprocess/extract/data.server';
import { handleError } from 'rizom/errors/handler.server';

export const initActions = {
	default: async ({ request, locals }: RequestEvent) => {
		const { api } = locals;

		const data = await extractData(request);
		try {
			const { email, name, password } = data;
			await api.createFirstPanelUser({ email, name, password });
			throw redirect(302, '/panel/login');
		} catch (err) {
			return handleError(err, {
				context: 'action',
				formData: { email: data.email }
			});
		}
	}
};
