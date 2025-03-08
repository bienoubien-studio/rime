import { hasProps, omit } from 'rizom/utils/object';
import { toCamelCase } from 'rizom/utils/string';
import type { CollectionHookBeforeUpsert } from 'rizom/types/hooks';
import type { GenericDoc } from 'rizom/types/doc';
import { cleanupStoredFiles } from '../disk/delete';
import { saveFile } from '../disk/save';
import { isUploadConfig } from 'rizom/config/utils';

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
export const processFileUpload: CollectionHookBeforeUpsert<GenericDoc> = async (args) => {
	const { operation, config, api } = args;
	if (!isUploadConfig(config)) throw new Error('Should never throw');

	let data = args.data || {};
	const hasSizeConfig = 'imageSizes' in config && Array.isArray(config.imageSizes);
	const sizesConfig = hasSizeConfig ? config.imageSizes : [];

	if (data.file) {
		if (operation === 'update') await cleanupStoredFiles({ config, api, id: args.originalDoc.id });
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
		if (operation === 'update') await cleanupStoredFiles({ config, api, id: args.originalDoc.id });
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
