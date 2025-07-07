import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const signInLoad = async ({ locals }: ServerLoadEvent) => {
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
