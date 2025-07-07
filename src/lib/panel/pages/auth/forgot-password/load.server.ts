import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const forgotPasswordLoad = async ({ locals }: ServerLoadEvent) => {
	const { session, rizom } = locals;
	if (!('mailer' in rizom.plugins)) {
		return error(404);
	}
	if (session) {
		throw redirect(302, '/');
	} else {
		return { form: {} };
	}
};
