import { redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import type { CollectionSlug } from '$lib/core/types/doc';
import { handleError } from '$lib/core/errors/handler.server';
import { safe } from '$lib/util/safe';

export default function (slug: CollectionSlug) {
	const actions: Actions = {
		/****************************************************/
		// Create
		/****************************************************/
		create: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			
			// A redirect parameter equals to 0 can be present if we're in a nested form
			// to prevent redirection after entry creation
			// ex: for relation creation
			const withoutRedirect = event.url.searchParams.get('redirect') === '0';
			const draft = event.url.searchParams.get('draft') === 'true';

			const [error, result] = await safe(
				rizom.collection(slug).create({
					data: await extractData(event.request),
					draft,
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

		/****************************************************/
		// Update
		/****************************************************/
		update: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			const id = event.params.id || '';
			const versionId = event.url.searchParams.get('versionId') || undefined
			const draft = event.url.searchParams.get('draft') === 'true';
			
			const [error, doc] = await safe(
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
			
			if(draft && 'versionId' in doc){
				const referer = event.request.headers.get('referer')
				if(referer && referer.includes('/versions')){
					return redirect(303, `/panel/${slug}/${doc.id}/versions?versionId=${doc.versionId}`)
				}else{
					return redirect(303, `/panel/${slug}/${doc.id}?versionId=${doc.versionId}`)
				}
			}

			return { doc };
		}
	};

	return actions;
}
