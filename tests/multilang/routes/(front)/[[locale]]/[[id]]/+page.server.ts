import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	const { api, user, rizom } = event.locals;
	let { id } = event.params;

	const locale = rizom.defineLocale({ event });

	if (!id && event.params.locale && !rizom.config.isValidLocale(event.params.locale)) {
		id = event.params.locale;
	}

	const query = id ? `where[attributes.slug][equals]=${id}` : `where[attributes.isHome][equals]=true`;
	const docs = await api.collection('pages').find({ query, locale, depth: 2 });
	if (!docs.length) {
		throw error(404, 'Not found');
	}

	if (user && docs[0]._live && event.url.searchParams.get('live') === '1') {
		return redirect(302, docs[0]._live);
	}

	return { doc: docs[0] };
};
