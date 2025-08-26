import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';
import { handleError } from '$lib/core/errors/handler.server';
import { extractData } from '$lib/core/operations/extract-data.server.js';
import type { CollectionSlug } from '$lib/core/types/doc';
import { trycatch } from '$lib/util/trycatch.js';
import { type Actions, type RequestEvent } from '@sveltejs/kit';
import { t__ } from '../../../core/i18n/index.js';

export default function (slug: CollectionSlug) {
	const actions: Actions = {
		/**
		 * Create a document.
		 * Action called when posting a form from the panel :
		 * /panel/{slug}/create
		 */
		create: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			// Get the redirect parameter ex: ?redirect=0 that can be present if we're in a nested form
			// to prevent redirection after entry creation ex: for relation creation
			const withoutRedirect = event.url.searchParams.get(PARAMS.REDIRECT) === 'false';

			const data = await extractData(event.request);

			const collection = rizom.collection(slug);

			const [error, document] = await trycatch(() => collection.create({ data, locale }));

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (withoutRedirect) {
				return {
					document,
					message: t__('common.doc_created')
				};
			}

			// Redirect to proper upload directory if collection.upload
			const params = collection.config.upload ? `?${PARAMS.UPLOAD_PATH}=${data._path || UPLOAD_PATH.ROOT_NAME}` : '';
			const redirectUrl = `/panel/${slug}/${document.id}${params}`;

			return {
				redirectUrl,
				document,
				message: t__('common.doc_created')
			};
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
			const data = await extractData(event.request);

			const [error, document] = await trycatch(() =>
				rizom.collection(slug).updateById({
					id,
					data,
					versionId,
					draft,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (draft && 'versionId' in document) {
				return {
					document,
					message: t__('common.version_created'),
					redirectUrl: `/panel/${slug}/${document.id}/versions?versionId=${document.versionId}`
				};
			}

			return {
				document,
				message: t__('common.doc_updated')
			};
		}
	};

	return actions;
}
