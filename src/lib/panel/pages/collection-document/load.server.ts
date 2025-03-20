import { error, type ServerLoad } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server';
import { buildConfigMap } from 'rizom/operations/tasks/configMap/index.server';
import { setDefaultValues } from 'rizom/operations/tasks/setDefaultValues';

import type { CollectionSlug, GenericDoc } from 'rizom/types/doc.js';
import { safe } from 'rizom/util/safe';

/////////////////////////////////////////////
// Document Load
//////////////////////////////////////////////
export function docLoad(slug: CollectionSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { api, locale, user, rizom } = event.locals;
		const { id } = event.params;

		if (!id) throw error(404, 'Not found');

		let doc: GenericDoc;
		let readOnly = false;
		const collection = api.collection<any>(slug);
		const operation = id === 'create' ? 'create' : 'update';

		if (id === 'create') {
			/** Check for authorizations */
			const authorized = collection.config.access.create(user, {});
			if (!authorized) {
				return { doc: {}, operation, status: 401 };
			}
			/** Make blank document */
			let blankDocument = collection.blank();
			const configMap = buildConfigMap(blankDocument, collection.config.fields);
			doc = await setDefaultValues({ data: blankDocument, adapter: rizom.adapter, configMap });
		} else {
			/** Check for authorizations */
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });
			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401 };
			}

			/** Get doc */
			const [error, document] = await safe(collection.findById({ id, locale }));
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
