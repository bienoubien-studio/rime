import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const forgotPasswordLoad = async ({ locals }: ServerLoadEvent) => {
	const { session, rizom } = locals;
	if (!('mailer' in rizom.plugins)) {
		return error(404);
	}

	if (session) {
		throw redirect(302, '/');
	} else {
		const imageExist = existsSync(path.join(process.cwd(), 'static', 'panel.jpg'));
		return {
			form: {},
			image: imageExist ? '/panel/panel.jpg' : null
		};
	}
};
