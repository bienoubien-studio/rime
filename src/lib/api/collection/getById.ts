import { error, json, type RequestEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types/doc';
import { handleAPIError } from '../handleError';

export default function (slug: PrototypeSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;
		const { id } = event.params;

		if (!id) {
			return error(404);
		}

		const paramLocale = event.url.searchParams.get('locale');
		const paramDepth = event.url.searchParams.get('depth');

		try {
			const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;
			const doc = await api.collection(slug).findById({ id, locale: paramLocale || locale, depth });
			return json({ doc });
		} catch (err: any) {
			return handleAPIError(err);
		}
	}

	return GET;
}
