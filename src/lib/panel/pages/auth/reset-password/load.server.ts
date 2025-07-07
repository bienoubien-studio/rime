import { redirect, error, type ServerLoadEvent } from '@sveltejs/kit';

export const resetPasswordLoad = async ({ locals, url }: ServerLoadEvent) => {
	const hasParams = url.searchParams.toString() !== '';

	if (!('mailer' in locals.rizom.plugins)) {
		return error(404);
	}

	if (!hasParams) {
		throw redirect(302, '/');
	}

	const token = url.searchParams.get('token');
	
	if (!token) {
		throw error(400, 'invalid link');
	}

	return {
		token: token
	};
	
};
