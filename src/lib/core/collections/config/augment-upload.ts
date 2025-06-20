import { text } from '$lib/fields/text/index.js';
import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
import { toCamelCase } from "$lib/util/string.js";
import validate from '$lib/util/validate.js';
import type { ImageSizesConfig } from "../../../types.js";
import type { AugmentCollectionFn } from "./types.js";

/**
 * Normalize config.upload and imagesSizes
 * add corresponding fields with validation if config.upload.accept is defined
 */
export const augmentUpdload: AugmentCollectionFn = ({ config, fields }) => {
	
  if (config.upload) {
		// set an empty object for config.upload if it's true
		config.upload = config.upload === true ? {} : config.upload;
		// Add panel thumbnail size if not already present
		const isPanelThumbnailInSizes =
			config.upload.imageSizes && config.upload.imageSizes.some((size: ImageSizesConfig) => size.name === 'thumbnail');
		if (!isPanelThumbnailInSizes) {
			const thumbnailSize = { name: 'thumbnail', width: 400, compression: 60 };
			config.upload.imageSizes = [thumbnailSize, ...(config.upload.imageSizes || [])];
		}

		// Add image size fields
		if ('imageSizes' in config && config.upload.imageSizes?.length) {
			const sizesFields = config.upload.imageSizes.map((size: ImageSizesConfig) =>
				text(toCamelCase(size.name)).hidden()
			);
			fields = [...fields, ...sizesFields];
		}

		// Add mimeType field
		const mimeType = text('mimeType').table({ sort: true, position: 99 }).hidden();

		// Add validation if accept is defined
		if ('accept' in config.upload && Array.isArray(config.upload.accept)) {
			const allowedMimeTypes = config.upload.accept;
			mimeType.raw.validate = (value) => {
				return (
					(typeof value === 'string' && allowedMimeTypes.includes(value)) ||
					`File should be the type of ${allowedMimeTypes.toString()}`
				);
			};
		}

    const pathField = text('_path')._root().hidden().validate(validate.uploadPath)
    pathField.toSchema = () => `_path: text('_path').references(() => ${makeUploadDirectoriesSlug(config.slug)}.id, {onDelete: 'cascade'})`
		
    // Add hidden fields
		fields.push(
      mimeType, 
      text('filename').hidden(), 
      text('filesize').hidden(),
      pathField,
    );
	}

	return { config, fields };
};
