import type { BuiltCollection, Collection, CompiledCollection } from '$lib/core/config/types/index.js';
import type { WithUpload } from '$lib/util/types.js';
import type { Field, FormField } from '$lib/fields/types.js';
import { isBlocksFieldRaw, isFormField, isGroupFieldRaw, isTabsFieldRaw, isTreeFieldRaw } from './field';

/**
 * Type guard to check if a configuration has upload capabilities
 * @param config The configuration object to check
 * @returns True if the configuration has upload capabilities, false otherwise
 * @example
 * if (isUploadConfig(collection)) {
 *   // Handle upload-specific functionality
 * }
 */
export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

/**
 * Checks if a collection configuration has authentication capabilities
 * @param config The collection configuration to check
 * @returns True if the collection has authentication capabilities, false otherwise
 * @example
 * if (isAuthConfig(collection)) {
 *   // Handle auth-specific functionality
 * }
 */
export const isAuthConfig = (config: Collection<any> | BuiltCollection | CompiledCollection) =>
	config.auth === true;

/**
 * Utility function to includes a module with internals imports in the config
 * the browser config is re-writed and sanitized, that way imports of external modules should be tracked 
 * like for example a tiptap extensions
 * @param module The module to mark as external
 * @param path should always be : import.meta.url, 
 * @param exportName The name of the export to use, defaults to 'default'
 * @returns The original module with external metadata attached
 * @example
 * 
 * // src/config/lorem-feature.ts
 * const LoremFeature = {
 *   name: 'lorem-fill',
 *   marks: [fillWithLorem]
 * };
 *
 * export default external(LoremFeature, import.meta.url);
 * 
 * // src/config/rizom.config.ts
 * import loremFeature from './lorem-feature.ts'
 * const writer = richText('writer').features('bold', loremFeature)
 */
export function external<T>(module: T, path: string, exportName: string = 'default'): T {
	Object.defineProperty(module, Symbol.for('external'), {
		value: { path, exportName },
		enumerable: false
	});
	return module;
}

/**
 * Retrieves a field configuration by its dot-notation path
 * @param path The dot-notation path to the field (e.g., 'attributes.title')
 * @param fields The array of fields to search through
 * @param options Optional settings for field lookup
 * @param options.inBlockType The block type to search within for blocks fields
 * @returns The found form field or undefined if not found
 * @example
 * // Get the title field in the attributes group
 * const titleField = getFieldConfigByPath('attributes.title', collection.fields);
 * 
 * // Get a field within a specific block type
 * const imageField = getFieldConfigByPath('content.image', collection.fields, { inBlockType: 'hero' });
 */
export const getFieldConfigByPath = (
	path: string, 
	fields: Field[], 
	options?: {
		inBlockType?: string;
	}
) => {
	const parts = path.split('.');

	const findInFields = (currentFields: Field[], remainingParts: string[]): FormField | undefined => {
		if (remainingParts.length === 0) return undefined;

		const currentPart = remainingParts[0];

		for (const field of currentFields) {
			// Handle tabs
			if (isTabsFieldRaw(field)) {
				const tab = field.tabs.find((t) => t.name === currentPart);
				if (tab) {
					return findInFields(tab.fields, remainingParts.slice(1));
				}
				continue;
			}

			// Handle regular fields
			if (isFormField(field)) {
				if (field.name === currentPart) {
					if (remainingParts.length === 1) {
						return field;
					}

					if (isGroupFieldRaw(field)) {
						return findInFields(field.fields, remainingParts.slice(1));
					}

					// Handle blocks
					if (isBlocksFieldRaw(field)) {
						if (options?.inBlockType) {
							const block = field.blocks.find((b) => b.name === options.inBlockType);
							if (block) {
								return findInFields(block.fields, remainingParts.slice(2));
							}
						}
					}

					if (isTreeFieldRaw(field)) {
						return findInFields(field.fields, remainingParts.slice(2));
					}
				}
			}
		}

		return undefined;
	};

	return findInFields(fields, parts);
};