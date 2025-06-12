import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const initLoad = async ({ locals }: ServerLoadEvent) => {
	const { session } = locals;
	if (session) {
		throw redirect(302, '/panel');
	} else {
		return { form: { email: '', password: '' } };
	}
};
