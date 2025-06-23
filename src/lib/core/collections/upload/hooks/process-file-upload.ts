import { omit } from '$lib/util/object.js';
import { toCamelCase } from '$lib/util/string.js';
import { cleanupStoredFiles } from '$lib/core/collections/upload/disk/delete.js';
import { saveFile } from '$lib/core/collections/upload/disk/save.js';
import { isUploadConfig } from '$lib/util/config.js';
import type { HookBeforeUpsert } from '$lib/core/config/types/hooks.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

/**
 * Hook that handles file upload processing and image resizing operations.
 *
 * @description
 * This hook performs the following operations:
 * 1. For new files:
 *    - Saves the uploaded file to storage
 *    - Generates different image sizes if configured
 *    - Updates document with file metadata and image variations
 *
 * 2. For file updates:
 *    - Removes old files from storage
 *    - Processes new file as above
 *
 * 3. For file deletions:
 *    - Removes files from storage
 *    - Cleans up image variations
 *    - Nullifies related document fields
 */
export const processFileUpload: HookBeforeUpsert<'collection', GenericDoc> = async (args) => {
	const { operation, config, rizom } = args;
	if (!isUploadConfig(config)) throw new Error('Should never throw');

	let data = args.data || {};
	const hasSizeConfig = 'imageSizes' in config.upload && Array.isArray(config.upload.imageSizes);
	const sizesConfig = hasSizeConfig ? config.upload.imageSizes : [];

	if (data.file) {
		if (operation === 'update') await cleanupStoredFiles({ config, rizom, id: args.originalDoc.id });
		const { filename, imageSizes } = await saveFile(data.file, sizesConfig!);
		data = {
			...omit(['file'], data),
			filename,
			...imageSizes
		};
	}

	// If data.file is explicitly set to null : delete file
	if (data.file === null) {
		// delete files
		if (operation === 'update') await cleanupStoredFiles({ config, rizom, id: args.originalDoc.id });
		// update data for DB update
		for (const size of sizesConfig!) {
			data = {
				...data,
				[toCamelCase(size.name)]: null
			};
		}
	}

	return { ...args, data };
};
