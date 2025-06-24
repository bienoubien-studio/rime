import { augmentHooks } from '$lib/core/collections/config/augment-hooks.js';
import { exctractPath } from '$lib/core/collections/upload/hooks/extract-path.js';
import {
	prepareDirectoryChildren,
	updateDirectoryChildren
} from '$lib/core/collections/upload/hooks/update-directory-children.js';
import { date } from '$lib/fields/date/index.js';
import { text } from '$lib/fields/text/index.js';
import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
import { uploadPath } from '$lib/util/validate.js';
import type { CollectionSlug } from '../../../types.js';
import type { CompiledCollection, CompiledConfig } from '../types/index.js';

/**
 * Creates an upload directories collection for collections with upload enabled
 * Eg. for medias this will create a collection medias_directories
 */
export function makeUploadDirectoriesCollections(config: CompiledConfig) {
	for (const collection of config.collections) {
		if (collection.upload) {
			const slug = makeUploadDirectoriesSlug(collection.slug);
			// If already created skip to the next colleciton
			// for exemple a versions collections of an upload
			// collection should not have a directories related table
			if (config.collections.filter((c) => c.slug === slug).length) continue;
			// else create the directory collection
			let directoriesCollection: CompiledCollection = {
				slug: slug as CollectionSlug,
				versions: false,
				access: collection.access,
				fields: [
					text('id').validate(uploadPath).unique().required().compile(),
					text('name').compile(),
					text('parent').compile(),
					date('createdAt').compile(),
					date('updatedAt').compile()
				],
				type: 'collection',
				label: {
					singular: `${collection.slug} directory`,
					plural: `${collection.slug} directories`,
					gender: 'f'
				},
				hooks: {
					beforeUpdate: [exctractPath, prepareDirectoryChildren],
					afterUpdate: [updateDirectoryChildren],
					beforeCreate: [exctractPath]
				},
				asTitle: 'path',
				panel: false
			};
			
			directoriesCollection = augmentHooks(directoriesCollection)

			config.collections = [...config.collections, directoriesCollection];
		}
	}

	return config;
}
