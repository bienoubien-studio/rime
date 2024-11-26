import { isAuthConfig } from '$lib/config/utils.js';
import extractData from '$lib/operations/preprocess/extract/data.server.js';
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { handleAPIError } from '../handleError';
import type { GetRegisterType } from 'rizom/types';
import type { AsyncReturnType } from 'rizom/types/utility';

export default function (slug: GetRegisterType<'PrototypeSlug'>) {
	//
	async function POST(event: RequestEvent) {
		const { api, locale } = event.locals;
		const collection = api.collection(slug);
		const data = await extractData(event.request);

		if (isAuthConfig(collection.config) && 'password' in data) {
			data.confirmPassword = data.password;
		}

		let result: AsyncReturnType<typeof collection.create>;
		try {
			result = await collection.create({ data, locale: data.locale || locale });
		} catch (err: any) {
			return handleAPIError(err);
		}

		if (result.errors) {
			return error(400, { message: Object.values(result.errors)[0] });
		}

		return json(result);
	}

	return POST;
}
