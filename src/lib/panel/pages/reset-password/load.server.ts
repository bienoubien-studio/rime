import { redirect, error, type ServerLoadEvent } from '@sveltejs/kit';

export const resetPasswordLoad = async ({ locals, url }: ServerLoadEvent) => {
	const hasParams = url.searchParams.toString() !== '';

	if (!hasParams) {
		throw redirect(302, '/');
	}

	const token = url.searchParams.get('token');
	const id = url.searchParams.get('id');
	const slug = url.searchParams.get('slug');

	if (!token || !id || !slug || !locals.rizom.config.getBySlug(slug)) {
		throw error(400, 'invalid link');
	}

	const isValidToken = await locals.rizom.auth.verifyForgotPasswordToken({
		token,
		id,
		userTableName: slug
	});

	if (!isValidToken) {
		throw error(400, 'invalid token');
	}

	return {
		userId: id,
		slug,
		token: token
	};
};
