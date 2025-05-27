import { error, type ServerLoad } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server';
import { buildConfigMap } from '$lib/core/operations/configMap/index.server';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues';
import { safe } from '$lib/util/safe';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';

/////////////////////////////////////////////
// Document Load
//////////////////////////////////////////////
export function docLoad(slug: CollectionSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { locale, user, rizom } = event.locals;
		const { id } = event.params;
		
		if (!id) throw error(404, 'Not found');

		let doc: GenericDoc;
		let readOnly = false;
		const collection = rizom.collection<any>(slug);
		const operation = id === 'create' ? 'create' : 'update';

		if (id === 'create') {
			/** Check for authorizations */
			const authorized = collection.config.access.create(user, {});
			if (!authorized) {
				return { doc: {}, operation, status: 401 };
			}
			/** Make blank document */
			const blankDocument = collection.blank();
			const configMap = buildConfigMap(blankDocument, collection.config.fields);
			doc = await setDefaultValues({ data: blankDocument, adapter: rizom.adapter, configMap });
		} else {
			/** Check for authorizations */
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });
			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401 };
			}

			const versionId = event.url.searchParams.get('versionId') || undefined

			/** Get doc */
			const [error, document] = await safe(collection.findById({ id, locale, versionId }));
			doc = document;
			
			if (error) {
				return handleError(error, { context: 'load' });
			}

			/** If update not allowed set doc as readOnly  */
			if (authorizedRead && !authorizedUpdate) {
				readOnly = true;
			}
		}

		return {
			doc,
			operation,
			status: 200,
			readOnly
		};
	};
	return load;
}
