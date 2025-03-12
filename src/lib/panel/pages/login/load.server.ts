import { redirect, type ServerLoadEvent } from '@sveltejs/kit';
import type { Dic } from 'rizom/types/util';

export const loginLoad = async ({ locals, url }: ServerLoadEvent) => {
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
