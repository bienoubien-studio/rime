import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/errors/handler.server.js';
import type { AreaSlug } from '$lib/types/doc.js';
import { safe } from '$lib/util/safe.js';
import type { Dic } from 'rizom/types/util';

export default function (slug: AreaSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');
		const paramDepth = event.url.searchParams.get('depth');
		const paramSelect = event.url.searchParams.get('select');
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;

		let params:Dic = { 
			locale: paramLocale || locale, 
			depth 
		}

		if( paramSelect ){
			params.select = paramSelect.split(',')
		}

		const [error, doc] = await safe(api.area(slug).find(params));
		
		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}
