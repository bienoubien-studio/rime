import { RizomError } from '$lib/core/errors/index.js';
import type { HookBeforeUpsert } from '$lib/core/config/types/index.js';
import { trycatch, trycatchSync } from '$lib/util/trycatch.js';
import { getSegments, type UploadPath } from '../util/path.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
import { logger } from '$lib/core/logger/index.server.js';
import { UPLOAD_PATH } from '$lib/core/constant.js';
import { cases } from '$lib/util/cases.js';

/**
 * Hook executed before save/update operations on an upload collections
 * the function get the document _path and check if it exists,
 * if it doesn't it create {upload_slug}_directories entries recursively
 */
export const handlePathCreation: HookBeforeUpsert<'collection', GenericDoc & { id: UploadPath }> = async (args) => {
	const { rizom } = args.event.locals;
	let data = args.data;

	const IS_CREATE_WITHOUT_PATH = !('_path' in args.data) && args.operation === 'create';

	if (IS_CREATE_WITHOUT_PATH) {
		args.data._path = 'root';
	}

	if (args.data._path) {
		const directorySlug = makeUploadDirectoriesSlug(args.config.slug);

		const [error, dir] = await trycatch(() => 
			rizom.collection(directorySlug).findById({
				select: ['id'],
				id: data._path
			})
		);

		if (dir) return args;

		// Use the getSegments utility to extract path information
		const pathInfo = getSegments(data._path);

		// Split the path into segments
		const segments = pathInfo.path.split(UPLOAD_PATH.SEPARATOR);

		// Process all segments, including root
		let currentPath = '';

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const parentPath = currentPath || null; // For root, parent is null

			// Build the current path
			currentPath = currentPath ? `${currentPath}${UPLOAD_PATH.SEPARATOR}${segment}` : segment;

			// Check if this segment exists
			const [segError, segExists] = await trycatch(() => 
				rizom.collection(directorySlug).findById({
					select: ['id'],
					id: currentPath
				})
			);

			// If the segment doesn't exist, create it
			if (!segExists) {
				const [createError] = await trycatch(() => 
					rizom.collection(directorySlug).create({
						data: {
							id: currentPath,
							parent: parentPath,
							name: segment,
							createdAt: new Date(),
							updatedAt: new Date()
						}
					})
				);

				if (createError) {
					logger.error(`Failed to create directory segment ${currentPath}`, createError);
					// If we can't create a segment, fall back to root
					args.data._path = UPLOAD_PATH.ROOT_NAME;
					return args;
				}
			}
		}
	}

	return args;
};
