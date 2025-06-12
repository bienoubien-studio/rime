import { error, type ServerLoad } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server';
import { buildConfigMap } from '$lib/core/operations/configMap/index.server';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues';
import { safe } from '$lib/util/safe';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import { PARAMS } from '$lib/core/constant.js';
import type { Dic, WithRequired } from '$lib/util/types.js';
import type { Route } from '$lib/panel/types.js';
import { env } from '$env/dynamic/public';
import { makeVersionsSlug } from '$lib/util/schema.js';
import { RizomError } from '$lib/core/errors/index.js';

/****************************************************/
/* Document Load
/****************************************************/
export function docLoad(slug: CollectionSlug, withVersion?: boolean) {
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
			doc = await setDefaultValues({
				data: blankDocument,
				adapter: rizom.adapter,
				configMap,
				mode: 'always'
			});
		} else {
			/** Check for authorizations */
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });
			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401 };
			}

			const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;

			/** Get doc */
			const [error, document] = await safe(collection.findById({ id, locale, versionId, draft: true }));
			doc = document;

			if (error) {
				return handleError(error, { context: 'load' });
			}

			/** If update not allowed set doc as readOnly  */
			if (authorizedRead && !authorizedUpdate) {
				readOnly = true;
			}
		}

		const aria: WithRequired<Partial<Route>, 'title'>[] = [
			{ title: 'Dashboard', icon: 'dashboard', path: `/panel` },
			{ title: collection.config.label.plural, path: `/panel/${collection.config.slug}` },
			{ title: doc.title }
		];

		let data: Dic = {
			aria,
			doc,
			operation,
			status: 200,
			readOnly
		};

		if (withVersion) {
			const url = `${env.PUBLIC_RIZOM_URL}/api/${makeVersionsSlug(doc._type)}?where[ownerId][equals]=${doc.id}&sort=-updatedAt&select=updatedAt,status`;
			const promise = event.fetch(url).then((r) => r.json());
			const [error, result] = await safe(promise);
			if (error || !Array.isArray(result.docs)) {
				throw new RizomError(RizomError.OPERATION_ERROR, 'while getting versions');
			}
			data = { ...data, versions: result.docs };
		}

		return data;
	};
	return load;
}
