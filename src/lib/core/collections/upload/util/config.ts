import type { UploadConfig } from '$lib/core/config/types.js';

export type WithUpload<T extends { upload?: boolean | UploadConfig }> = T & {
	upload: UploadConfig;
};

/**
 * Type guard to check if a configuration has upload capabilities
 * @example
 * if (isUploadConfig(collection)) {
 *   // Handle upload-specific functionality
 * }
 */
export function isUploadConfig(config: { upload?: UploadConfig }): config is WithUpload<typeof config> {
	return Boolean('upload' in config && config.upload);
}
