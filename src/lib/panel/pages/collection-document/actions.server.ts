import { redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import extractData from 'rizom/operations/preprocess/extract/data.server';
import type { CollectionSlug } from 'rizom/types/doc';
import { handleError } from 'rizom/errors/handler.server';
import { safe } from 'rizom/utils/safe';

export default function (slug: CollectionSlug) {
	const actions: Actions = {
		//////////////////////////////////////////////
		// Create
		//////////////////////////////////////////////
		create: async (event: RequestEvent) => {
			const { api, locale } = event.locals;
			let doc;

			// A redirect parameter equals to 0 can be present if we're in a nested form
			// to prevent redirection after entry creation
			// ex: for relation creation
			const withoutRedirect = event.url.searchParams.get('redirect') === '0';

			const [error, result] = await safe(
				api.collection(slug).create({
					data: await extractData(event.request),
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (withoutRedirect) {
				return { doc: result.doc };
			}

			return redirect(303, `/panel/${slug}/${result.doc.id}`);
		},

		//////////////////////////////////////////////
		// Update
		//////////////////////////////////////////////
		update: async (event: RequestEvent) => {
			const { api, locale } = event.locals;
			const id = event.params.id || '';

			const [error, doc] = await safe(
				api.collection(slug).updateById({
					id,
					data: await extractData(event.request),
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			return { doc };
		}
	};

	return actions;
}
