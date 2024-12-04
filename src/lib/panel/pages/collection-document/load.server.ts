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
		let readOnly = false;
		const collection = api.collection(slug);
		const operation = id === 'create' ? 'create' : 'update';

		if (id === 'create') {
			const authorized = collection.config.access.create(user);
			if (!authorized) {
				return { doc: {}, operation, status: 401 };
			}

			const emptyDoc = collection.emptyDoc();
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
			doc = await collection.findById({ id, locale });
			if (!doc) throw error(404, 'Not found');

			/** Check for currently editing user */
			// Scenarios :
			// - no one editing // set the current editor to user.id
			// - someone editing // set nothing
			// - someone editing but take control // set the current editor to user.id
			let currentEditorId: string | undefined;
			const someOneEditing = doc._editedBy.length;
			const takeControl = event.url.searchParams.get('take_control') === '1';
			if (!someOneEditing || (someOneEditing && takeControl)) {
				await collection.updateById({
					id,
					data: {
						_editedBy: [user!.id]
					}
				});
				currentEditorId = user!.id;
			} else if (someOneEditing) {
				currentEditorId = doc._editedBy.at(0).relationId;
			}

			/** resolve the relation to get user attributes */
			if (currentEditorId) {
				const currentEditor = await api.collection('users').findById({
					id: currentEditorId
				});
				doc._editedBy = [currentEditor];
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
