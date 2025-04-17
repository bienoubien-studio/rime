import { isAuthConfig } from '$lib/util/config.js';
import { extractData } from '$lib/operations/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from '$lib/errors/handler.server.js';
import type { CollectionSlug } from '$lib/types/doc.js';
import { safe } from '$lib/util/safe.js';

export default function (slug: CollectionSlug) {
	//
	async function POST(event: RequestEvent) {
		const { api, locale } = event.locals;

		const collection = api.collection(slug);
		const data = await extractData(event.request);

		// Bypass confirm password for api auth collection creation calls
		if (isAuthConfig(collection.config) && 'password' in data) {
			data.confirmPassword = data.password;
		}

		const [error, result] = await safe(collection.create({ data, locale: data.locale || locale }));

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json(result);
	}

	return POST;
}
