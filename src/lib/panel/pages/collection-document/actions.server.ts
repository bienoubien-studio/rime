import { redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/extract-data.server.js';
import type { CollectionSlug } from '$lib/core/types/doc';
import { handleError } from '$lib/core/errors/handler.server';
import { trycatch } from '$lib/util/trycatch.js';
import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';

export default function (slug: CollectionSlug) {
	const actions: Actions = {
		
		/**
		 * Create a document.
		 * Action called when posting a form from the panel :
		 * /panel/{slug}/create
		 */
		create: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;

			// A redirect parameter equals to 0 can be present if we're in a nested form
			// to prevent redirection after entry creation
			// ex: for relation creation
			const withoutRedirect = event.url.searchParams.get(PARAMS.REDIRECT) === '0';
			const data = await extractData(event.request);
			const collection = rizom.collection(slug);
			
			const [error, document] = await trycatch(
				collection.create({
					data,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (withoutRedirect) {
				return document;
			}

			// Redirect to proper upload directory if collection.upload
			const params = collection.config.upload ? `?${PARAMS.UPLOAD_PATH}=${data._path || UPLOAD_PATH.ROOT_NAME}` : '';

			return redirect(303, `/panel/${slug}/${document.id}${params}`);
		},

		/**
		 * Update a document.
		 * Action called when posting a form from the panel :
		 * /panel/{slug}/{documentId}
		 */
		update: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			const id = event.params.id || '';
			const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
			const draft = event.url.searchParams.get(PARAMS.DRAFT) === 'true';

			const [error, document] = await trycatch(
				rizom.collection(slug).updateById({
					id,
					data: await extractData(event.request),
					versionId,
					draft,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (draft && 'versionId' in document) {
				return redirect(303, `/panel/${slug}/${document.id}/versions?versionId=${document.versionId}`);
			}

			return document;
		}
	};

	return actions;
}
