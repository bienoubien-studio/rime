import { fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import logger from 'rizom/utils/logger';
import extractData from 'rizom/operations/preprocess/extract/data.server';
import type { PrototypeSlug } from 'rizom/types/doc';
import type { PanelActionFailure } from 'rizom/types/panel';

export default function (slug: PrototypeSlug) {
	const actions: Actions = {
		//////////////////////////////////////////////
		// Create
		//////////////////////////////////////////////
		create: async (event: RequestEvent) => {
			const { api, locale } = event.locals;
			let doc;
			const withoutRedirect = event.url.searchParams.get('redirect') === '0';
			try {
				const data = await extractData(event.request);
				const result = await api.collection(slug).create({
					data,
					locale
				});
				if ('errors' in result) {
					return fail<PanelActionFailure>(400, { errors: result.errors });
				} else {
					doc = result.doc;
				}
			} catch (err: any) {
				logger.error(err);
				return fail<PanelActionFailure>(500, { error: err.message });
			}
			if (withoutRedirect) {
				return { doc };
			}
			return redirect(303, `/panel/${slug}/${doc.id}`);
		},

		//////////////////////////////////////////////
		// Update
		//////////////////////////////////////////////
		update: async (event: RequestEvent) => {
			const { api, locale } = event.locals;
			const id = event.params.id || '';

			try {
				const data = await extractData(event.request);
				const result = await api.collection(slug).updateById({
					id,
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
