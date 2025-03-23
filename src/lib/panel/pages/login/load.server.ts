import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const loginLoad = async ({ locals }: ServerLoadEvent) => {
	const { session, rizom } = locals;
	if (session) {
		throw redirect(302, '/panel');
	} else {
		return {
			forgotPasswordEnabled: 'mailer' in rizom.plugins,
			form: {}
		};
	}
};
