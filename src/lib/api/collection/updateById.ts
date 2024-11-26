import { isAuthConfig } from '$lib/config/utils';
import extractData from '$lib/operations/preprocess/extract/data.server';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types/doc';
import { handleAPIError } from '../handleError';

export default function (slug: PrototypeSlug) {
	//
	async function PATCH(event: RequestEvent) {
		const { api, locale } = event.locals;
		const id = event.params.id;

		if (!id) {
			return error(404);
		}

		const collection = api.collection(slug);

		try {
			const data = await extractData(event.request);
			if (isAuthConfig(collection.config) && 'password' in data) {
				data.confirmPassword = data.password;
			}
			const doc = await collection.updateById({
				id,
				data,
				locale: data.locale || locale
			});
			return json({ doc });
		} catch (err: any) {
			return handleAPIError(err);
		}
	}

	return PATCH;
}
