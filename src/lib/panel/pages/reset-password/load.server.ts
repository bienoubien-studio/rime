import { redirect, error, type ServerLoadEvent } from '@sveltejs/kit';

export const resetPasswordLoad = async ({ locals, url }: ServerLoadEvent) => {
	const hasParams = url.searchParams.toString() !== '';

	if (!hasParams) {
		throw redirect(302, '/');
	}

	const token = url.searchParams.get('token');
	const slug = url.searchParams.get('slug');

	if (!token || !slug || !locals.rizom.config.getBySlug(slug)) {
		throw error(400, 'invalid link');
	}

	return {
		slug,
		token: token
	};
};
