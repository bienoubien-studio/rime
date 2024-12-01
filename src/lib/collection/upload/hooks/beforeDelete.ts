import type { CollectionHookBeforeDelete } from 'rizom/types/hooks';
import type { BuiltUploadCollectionConfig } from 'rizom/types/config';
import { cleanupStoredFiles } from '../disk/delete';

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
	const config = args.config as BuiltUploadCollectionConfig;
	const event = args.event;
	const id = (event && event.params.id) || '';
	await cleanupStoredFiles({ config, api: args.api, id });
	return args;
};
