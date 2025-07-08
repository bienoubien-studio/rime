import { cleanupStoredFiles } from '$lib/core/collections/upload/disk/delete.js';
import type { HookBeforeDelete } from '$lib/core/config/types/index.js';
import type { WithUpload } from '$lib/util/types.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

/**
 * Hook executed before deleting a document to clean up associated files from storage.
 *
 * @description
 * This hook performs the following operations:
 * 1. Retrieves the document ID from the deletion event
 * 2. Locates and removes all files associated with the document from storage
 * 3. Ensures no orphaned files remain after document deletion
 *
 */
export const cleanUpFiles: HookBeforeDelete<GenericDoc> = async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const event = args.event;
	const id = (event && event.params.id) || '';
	await cleanupStoredFiles({ config, rizom: args.rizom, id });
	return args;
};
