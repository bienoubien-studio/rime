import { exctractPath } from '$lib/core/collections/upload/hooks/extract-path.js';
import { prepareDirectoryChildren, updateDirectoryChildren } from '$lib/core/collections/upload/hooks/update-directory-children.js';
import { buildDataConfigMap } from '$lib/core/operations/hooks/before-upsert/data-config-map.server.js';
import { setDefaultValues } from '$lib/core/operations/hooks/before-upsert/set-default-values.server.js';
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
			const directoriesCollection: CompiledCollection = {
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
					beforeUpdate: [ buildDataConfigMap, setDefaultValues, exctractPath, prepareDirectoryChildren],
					afterUpdate: [ updateDirectoryChildren],
					beforeCreate: [ buildDataConfigMap, setDefaultValues, exctractPath]
				},
				asTitle: 'path',
				panel: false
			};
			config.collections = [...config.collections, directoriesCollection];
		}
	}

	return config;
}
