import { error, type ServerLoadEvent } from '@sveltejs/kit';
import { handleError } from '$lib/core/errors/handler.server';
import { trycatch } from '$lib/util/trycatch.js';
import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';
import { env } from '$env/dynamic/public';
import { makeVersionsSlug } from '$lib/util/schema.js';
import { RizomError } from '$lib/core/errors/index.js';
import { buildUploadAria, type UploadPath } from '$lib/core/collections/upload/util/path.js';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { WithRequired } from '$lib/util/types.js';
import type { Route } from '$lib/panel/types.js';
import type { CollectionDocData } from '$lib/panel/index.js';

/****************************************************/
/* Document Load
/****************************************************/
export function docLoad(slug: CollectionSlug, withVersion?: boolean) {
	//
	const load = async <V extends boolean = boolean>(event: ServerLoadEvent) => {
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
				return { doc: {}, operation, status: 401, readOnly: true } as CollectionDocData<false>;
			}
			doc = collection.blank();
		} else {
			/** Check for authorizations */
			const authorizedRead = collection.config.access.read(user, { id });
			const authorizedUpdate = collection.config.access.update(user, { id });
			if (!authorizedRead && !authorizedUpdate) {
				return { doc: {}, operation, status: 401, readOnly: true } as CollectionDocData<false>;
			}

			const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;

			/** Get doc */
			const [error, document] = await trycatch(() => collection.findById({ id, locale, versionId, draft: true }));
			doc = document;

			if (error) {
				throw handleError(error, { context: 'load' });
			}

			/** If update not allowed set doc as readOnly  */
			if (authorizedRead && !authorizedUpdate) {
				readOnly = true;
			}
		}

		let aria: WithRequired<Partial<Route>, 'title'>[];

		const collectionAria = { title: collection.config.label.plural, path: `/panel/${collection.config.slug}` };
		if (collection.config.upload) {
			const paramUploadPath = event.url.searchParams.get('uploadPath') as UploadPath | null;
			const currentDirectoryPath = paramUploadPath || UPLOAD_PATH.ROOT_NAME;
			aria = [
				{ title: 'Dashboard', icon: 'dashboard', path: `/panel` },
				collectionAria,
				...buildUploadAria({ path: currentDirectoryPath, slug }),
				{ title: doc.title }
			];
		} else {
			aria = [
				{ title: 'Dashboard', icon: 'dashboard', path: `/panel` },
				{ title: collection.config.label.plural, path: `/panel/${collection.config.slug}` },
				{ title: doc.title }
			];
		}

		let data: CollectionDocData = {
			aria,
			doc,
			operation,
			status: 200,
			readOnly
		};

		if (withVersion) {
			const url = `${env.PUBLIC_RIZOM_URL}/api/${makeVersionsSlug(doc._type)}?where[ownerId][equals]=${doc.id}&sort=-updatedAt&select=updatedAt,status`;
			const promise = event.fetch(url).then((r) => r.json());
			const [error, result] = await trycatch(() => promise);
			if (error || !Array.isArray(result.docs)) {
				throw new RizomError(RizomError.OPERATION_ERROR, 'while getting versions');
			}
			data = { ...data, versions: result.docs };
		}
		
		return data as CollectionDocData<V>;

	};

	return load;
}
