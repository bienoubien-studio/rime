import type { Collection, CollectionHooks, GenericDoc } from '../../../types.js';
import * as authHooks from '$lib/core/collections/auth/hooks/hooks.server.js';
import * as nestedHooks from '$lib/core/collections/nested/hooks/index.server.js';
import { setDocumentTitle } from '$lib/core/operations/hooks/before-read/set-document-title.server.js';
import { setDocumentLocale } from '$lib/core/operations/hooks/before-read/set-document-locale.server.js';
import { setDocumentType } from '$lib/core/operations/hooks/before-read/set-document-type.server.js';
import { sortDocumentProps } from '$lib/core/operations/hooks/before-read/sort-document-props.server.js';
import { castBase64ToFile } from '../upload/hooks/convert-base64.js';
import { processFileUpload } from '../upload/hooks/process-file-upload.js';
import { cleanUpFiles } from '../upload/hooks/clean-up-files.js';
import { populateSizes } from '../upload/hooks/populate-sizes.server.js';
import { processDocumentFields } from '$lib/core/operations/hooks/before-read/process-document-fields.server.js';
import { validateFields } from '$lib/core/operations/hooks/before-upsert/validate-fields.server.js';
import { setDefaultValues } from '$lib/core/operations/hooks/before-upsert/set-default-values.server.js';
import { populateURL } from '$lib/core/operations/hooks/before-read/populate-url.server.js';
import { buildDataConfigMap } from '$lib/core/operations/hooks/before-upsert/data-config-map.server.js';
import { mergeWithBlankDocument } from '$lib/core/operations/hooks/before-create/merge-with-blank.server.js';

/**
 * Augment a collection config with hooks based on different configs
 * upload, url, nesting, auth
 */
export const augmentHooks = (collection: Collection<any>): Collection<any> => {

	let hooks: Required<CollectionHooks<GenericDoc>> = {

		beforeRead: [
			processDocumentFields,
			setDocumentTitle,
			setDocumentLocale,
			setDocumentType
		],

		beforeUpdate: [
			buildDataConfigMap,
			setDefaultValues,
			validateFields
		],

		afterUpdate: [],

		beforeCreate: [
			mergeWithBlankDocument,
			buildDataConfigMap,
			setDefaultValues,
			validateFields
		],

		afterCreate: [],
		beforeDelete: [],
		afterDelete: [],

	}


	if (collection.auth) {

		hooks = {
			...hooks,
			beforeUpdate: [
				...hooks.beforeUpdate,
				authHooks.preventSuperAdminMutation,
				authHooks.forwardRolesToBetterAuth,
			],
			beforeCreate: [
				...hooks.beforeCreate,
				authHooks.createBetterAuthUser,
			],
			afterCreate: [
				...hooks.afterCreate,
				authHooks.afterCreateSetAuthUserRole
			],
			beforeDelete: [
				...hooks.beforeDelete,
				authHooks.preventSupperAdminToBeDeleted,
			],
			afterDelete: [
				...hooks.afterDelete,
				authHooks.deleteBetterAuthUser
			]
		};
	}

	if (collection.upload) {
		hooks = {
			...hooks,
			beforeUpdate: [
				...hooks.beforeUpdate,
				castBase64ToFile,
				processFileUpload
			],
			beforeCreate: [
				...hooks.beforeCreate,
				castBase64ToFile,
				processFileUpload
			],
			beforeDelete: [
				...hooks.beforeDelete,
				cleanUpFiles
			],
			beforeRead: [
				...hooks.beforeRead,
				populateSizes,
			]
		};
	}


	if (collection.url) {
		hooks = {
			...hooks,
			beforeRead: [...hooks.beforeRead, populateURL]
		};
	}


	if (collection.nested) {
		hooks = {
			...hooks,
			beforeRead: [...hooks.beforeRead, nestedHooks.addChildrenProperty]
		};
	}

	hooks = {
		...hooks,
		beforeRead: [...hooks.beforeRead, sortDocumentProps]
	};


	return {
		...collection,
		hooks: {
			beforeCreate: [
				...hooks.beforeCreate,
				...(collection.hooks?.beforeCreate || [])
			],
			afterCreate: [
				...hooks.afterCreate,
				...(collection.hooks?.afterCreate || [])
			],
			beforeUpdate: [
				...hooks.beforeUpdate,
				...(collection.hooks?.beforeUpdate || [])
			],
			afterUpdate: [
				...hooks.afterUpdate,
				...(collection.hooks?.afterUpdate || [])
			],
			beforeDelete: [
				...hooks.beforeDelete,
				...(collection.hooks?.beforeDelete || [])
			],
			afterDelete: [
				...hooks.afterDelete,
				...(collection.hooks?.afterDelete || [])
			],
			beforeRead: [
				...hooks.beforeRead,
				...(collection.hooks?.beforeRead || [])
			]
		}
	};
};
