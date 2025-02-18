import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	const { api, user, rizom } = event.locals;

	const locale = rizom.defineLocale({ event });
	event.locals.locale = locale;
	if (locale) {
		event.cookies.set('Locale', locale, { path: '.' });
	}

	const doc = await api.area('infos').find({ locale, depth: 1 });

	if (!doc) {
		throw error(404, 'Not found');
	}

	if (user && doc._live && event.url.searchParams.get('live') === '1') {
		return redirect(302, doc._live);
	}

	return { doc: doc };
};
