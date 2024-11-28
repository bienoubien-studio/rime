import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	const { id } = event.params;
	const { api, user, rizom } = event.locals;

	const locale = rizom.defineLocale({ event });

	// if (!id && event.params.locale && !isValidLocale) {
	// 	id = event.params.locale;
	// }

	if (locale) {
		event.locals.locale = locale;
		event.cookies.set('Locale', locale, { path: '.' });
	}

	const query = id ? `where[slug][equals]=id` : `where[home][equals]=true`;
	const docs = await api.collection('pages').find({ query, locale, depth: 2 });
	if (!docs.length) {
		throw error(404, 'Not found');
	}

	if (user && docs[0]._live && event.url.searchParams.get('live') === '1') {
		return redirect(302, docs[0]._live);
	}

	return { doc: docs[0] };
};
