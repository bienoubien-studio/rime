import { fail, type RequestEvent } from '@sveltejs/kit';
import extractData from '$lib/operations/preprocess/extract/data.server';
import type { PrototypeSlug } from '$lib/types';
import type { PanelActionFailure } from 'rizom/types/panel';
import logger from 'rizom/utils/logger';

export default function (slug: PrototypeSlug) {
	const actions = {
		update: async (event: RequestEvent) => {
			const { api, locale } = event.locals;

			try {
				const data = await extractData(event.request);
				const result = await api.global(slug).update({
					data,
					locale
				});
				if ('errors' in result) {
					return fail<PanelActionFailure>(400, { errors: result.errors });
				}
				return { doc: result.doc };
			} catch (err: any) {
				logger.error(err);
				return fail<PanelActionFailure>(500, { error: err.message });
			}
		}
	};
	return actions;
}
