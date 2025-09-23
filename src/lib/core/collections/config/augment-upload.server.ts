import { makeUploadDirectoriesSlug } from '$lib/adapter-sqlite/generate-schema/util.js';
import type { Collection } from '$lib/core/config/types.js';
import { FormFieldBuilder } from '$lib/core/fields/builders/form-field-builder.js';
import { augmentUpload, type WithNormalizedUpload } from './augment-upload.js';

/**
 * Normalize config.upload and imagesSizes
 * add corresponding fields with validation if config.upload.accept is defined
 */
export const augmentUploadServer = <T extends Collection<any>>(config: T): WithNormalizedUpload<T> => {
	const collection = augmentUpload(config);
	collection.fields.forEach((field) => {
		if (field instanceof FormFieldBuilder && field.name === '_path') {
			field = field.$generateSchema(
				() =>
					`_path: text('_path').references(() => ${makeUploadDirectoriesSlug(config.slug)}.id, {onDelete: 'cascade', onUpdate: 'cascade'})`
			);
		}
	});
	return collection;
};
