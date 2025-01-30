import { error, type ServerLoad } from '@sveltejs/kit';
import { buildConfigMap } from 'rizom/operations/preprocess/config/map.js';
import { addDefaultValues } from 'rizom/operations/preprocess/fill/index.js';
import type { CollectionSlug, GenericDoc } from 'rizom/types/doc.js';

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
		const collection = api.collection(slug);
		const operation = id === 'create' ? 'create' : 'update';

		if (id === 'create') {
			const authorized = collection.config.access.create(user);
			if (!authorized) {
				return { doc: {}, operation, status: 401 };
			}

			const emptyDoc = collection.blank();
			const configMap = buildConfigMap(emptyDoc, collection.config.fields);
			doc = await addDefaultValues({ data: emptyDoc, configMap, adapter: rizom.adapter });
		} else {
			/** Check for authorizations */
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });
			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401 };
			}

			/** Get doc */
			const docById = await collection.findById({ id, locale });
			if (!docById) throw error(404, 'Not found');
			doc = docById;

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
