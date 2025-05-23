import { cleanupStoredFiles } from '$lib/core/collections/upload/disk/delete.js';
import type { CollectionHookBeforeDelete } from '$lib/core/config/types/hooks.js';
import type { WithUpload } from '$lib/util/types.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';

/**
 * Hook executed before deleting a document to clean up associated files from storage.
 *
 * @description
 * This hook performs the following operations:
 * 1. Retrieves the document ID from the deletion event
 * 2. Locates and removes all files associated with the document from storage
 * 3. Ensures no orphaned files remain after document deletion
 *
 * @param args Hook arguments containing config, API context and deletion event
 * @returns Unmodified args object after file cleanup
 */
export const beforeDelete: CollectionHookBeforeDelete = async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const event = args.event;
	const id = (event && event.params.id) || '';
	await cleanupStoredFiles({ config, api: args.api, id });
	return args;
};
