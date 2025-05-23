import { RizomError } from '$lib/core/errors/index.js';
import { isFile } from '$lib/util/file.js';
import { jsonFileToFile } from '$lib/core/collections/upload/util/converter.js';
import type { CollectionHookBeforeUpsert } from '$lib/core/config/types/hooks.js';
import type { UploadDoc } from '$lib/core/types/doc.js';

/**
 * Hook executed before save/update operations to convert base64 encoded files to File objects.
 *
 * @description
 * This hook performs the following operations:
 * 1. Checks if the incoming document contains a base64 encoded file
 * 2. Converts it to a proper File object for disk storage
 * 3. Preserves or generates metadata (filename, size, type)
 *
 * @param args Hook arguments containing the document to process
 * @returns Updated args object with converted file data
 */
export const castBase64ToFile: CollectionHookBeforeUpsert<UploadDoc> = async (args) => {
	let data = args.data;
	if (data?.file && !isFile(data.file)) {
		try {
			const { file, filename, filesize, mimeType } = jsonFileToFile(data.file);
			data = {
				...data,
				file,
				filename: data.filename || filename,
				filesize: data.filesize || filesize,
				mimeType: data.mimeType || mimeType
			};
		} catch {
			throw new RizomError(RizomError.UPLOAD, 'Unable to process file');
		}
	}
	return { ...args, data };
};
