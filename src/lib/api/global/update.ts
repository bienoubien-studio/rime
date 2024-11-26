import extractData from '$lib/operations/preprocess/extract/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types/doc';
import { handleAPIError } from '../handleError';

export default function (slug: PrototypeSlug) {
	//
	async function POST(event: RequestEvent) {
		const { api, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');

		try {
			const data = await extractData(event.request);
			const doc = await api
				.global(slug)
				.update({ data, locale: paramLocale || data.locale || locale });
			return json({ doc });
		} catch (err: any) {
			return handleAPIError(err);
		}
	}

	return POST;
}
