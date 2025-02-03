import { redirect, type ServerLoadEvent } from '@sveltejs/kit';
import type { Dic } from 'rizom/types/utility';

export const loginLoad = async ({ locals, url }: ServerLoadEvent) => {
	const { session, rizom } = locals;
	const data: Dic = {
		forgotPasswordLink: false,
		form: {}
	};
	// if ('mailer' in rizom.plugins) {
	// 	data.forgotPasswordLink = true;
	// }
	if (session) {
		throw redirect(302, '/panel');
	} else {
		return data;
	}
};
