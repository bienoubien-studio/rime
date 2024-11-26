import { error, type ServerLoad } from '@sveltejs/kit';
import { buildConfigMap } from 'rizom/operations/preprocess/config/map.js';
import { addDefaultValues } from 'rizom/operations/preprocess/fill/index.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';

/////////////////////////////////////////////
// Document Load
//////////////////////////////////////////////
export function docLoad(slug: PrototypeSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { api, locale, user, rizom } = event.locals;
		const { id } = event.params;

		if (!id) throw error(404, 'Not found');

		let doc: GenericDoc;
		const collection = api.collection(slug);
		const operation = id === 'create' ? 'create' : 'update';
		// const type: CMS.RouteType =
		//   id === 'create' ? 'collection.create' : 'collection.update';

		if (id === 'create') {
			//
			const authorized = collection.config.access.create(user);
			if (!authorized) {
				return { doc: {}, operation, status: 401 };
			}

			const emptyDoc = collection.emptyDoc();
			const configMap = buildConfigMap(emptyDoc, collection.config.fields);
			doc = await addDefaultValues({ data: emptyDoc, configMap, adapter: rizom.adapter });

			//
		} else {
			//
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });

			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401 };
			}

			doc = await collection.findById({ id, locale });

			if (!doc) throw error(404, 'Not found');

			if (authorizedRead && !authorizedUpdate) {
				return { doc, operation, status: 200, readOnly: true };
			}
			//
		}

		return {
			doc,
			operation,
			status: 200,
			readOnly: false
		};
	};
	return load;
}
