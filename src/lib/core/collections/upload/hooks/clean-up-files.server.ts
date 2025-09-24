import { cleanupStoredFiles } from '$lib/core/collections/upload/disk/delete.server.js';
import type { CompiledCollection } from '$lib/core/config/types.js';
import { Hooks } from '$lib/core/operations/hooks/index.server.js';
import type { WithUpload } from '../util/config';

/**
 * Hook executed before deleting a document to clean up associated files from storage.
 *
 * This hook performs the following operations:
 * 1. Retrieves the document ID from the deletion event
 * 2. Locates and removes all files associated with the document from storage
 * 3. Ensures no orphaned files remain after document deletion
 *
 */
export const cleanUpFiles = Hooks.beforeDelete(async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const id = args.context.params.id || '';
	await cleanupStoredFiles({ config, rizom: args.event.locals.rizom, id });
	return args;
});
