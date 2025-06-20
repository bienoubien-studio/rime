import type { Collection, CollectionHooks } from '../../../types.js';
import * as authHooks from '$lib/core/collections/auth/hooks/hooks.server.js';
import * as uploadHooks from '$lib/core/collections/upload/hooks/index.server.js';
import * as urlHooks from '$lib/core/collections/config/hooks/url.server.js';
import * as nestedHooks from '$lib/core/collections/nested/hooks/index.server.js';

/**
 * Augment a collection config with hooks based on different configs
 * upload, url, nesting, auth 
 */
export const augmentHooks = (collection: Collection<any>): Collection<any> => {
	let hooks: CollectionHooks<any> = { ...collection.hooks };
	if (collection.auth) {
		const { beforeUpdate, beforeCreate, beforeDelete, afterDelete, afterCreate } = authHooks;
		hooks = {
			...hooks,
			beforeUpdate: [beforeUpdate, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [beforeCreate, ...(hooks?.beforeCreate || [])],
			afterCreate: [afterCreate, ...(hooks?.afterCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])],
			afterDelete: [afterDelete, ...(hooks?.afterDelete || [])]
		};
	}
	if (collection.upload) {
		const { castBase64ToFile, processFileUpload, beforeDelete, populateSizes } = uploadHooks;
		hooks = {
			...hooks,
			beforeUpdate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeUpdate || [])],
			beforeCreate: [castBase64ToFile, processFileUpload, ...(hooks?.beforeCreate || [])],
			beforeDelete: [beforeDelete, ...(hooks?.beforeDelete || [])],
			beforeRead: [populateSizes, ...(hooks?.beforeRead || [])]
		};
	}
	if (collection.url) {
		const { populateURL } = urlHooks;
		hooks = {
			...hooks,
			beforeRead: [populateURL, ...(hooks?.beforeRead || [])]
		};
	}
	if (collection.nested) {
		const { addChildrenProperty } = nestedHooks;
		hooks = {
			...hooks,
			beforeRead: [addChildrenProperty, ...(hooks?.beforeRead || [])]
		};
	}

	return {
    ...collection,
    hooks
  };
};
