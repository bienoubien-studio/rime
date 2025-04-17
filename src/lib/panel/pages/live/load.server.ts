import { error, redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from '$lib/types/doc';

export async function liveLoad(event: ServerLoadEvent) {
	const { api, user, rizom } = event.locals;
	event.depends('data:src');
	const params = event.url.searchParams;

	const id = params.get('id');
	const locale = params.get('locale') || undefined;
	const slug = params.get('slug') as PrototypeSlug;
	const src = params.get('src');

	// const pathToBrowserConfig = '../../../lib/rizom.config.browser.js';

	if(!user){
		error(404, 'Not found')
	}
	if (user && src && slug && id) {
		const output = { user, src: src, slug, locale };

		if (rizom.config.isCollection(slug)) {
			const doc = await api.collection(slug).findById({ id, locale });
			return { ...output, doc };
		} else {
			const doc = await api.area(slug).find({ locale });
			return { ...output, doc };
		}
	} else {
		redirect(302, '/');
	}
}
