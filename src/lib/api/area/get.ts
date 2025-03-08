import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server';
import type { AreaSlug } from 'rizom/types/doc';
import { safe } from 'rizom/util/safe';

export default function (slug: AreaSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');
		const paramDepth = event.url.searchParams.get('depth');
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;

		const [error, doc] = await safe(api.area(slug).find({ locale: paramLocale || locale, depth }));

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}
