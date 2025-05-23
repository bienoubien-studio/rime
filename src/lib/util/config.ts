import type { BuiltCollection, Collection, CompiledCollection } from '$lib/core/config/types/index.js';
import type { WithUpload } from '$lib/util/types.js';
import type { Field, FormField } from '$lib/fields/types.js';
import { isBlocksFieldRaw, isFormField, isGroupFieldRaw, isTabsFieldRaw, isTreeFieldRaw } from './field';

export function isUploadConfig(config: { upload?: boolean }): config is WithUpload<typeof config> {
	return 'upload' in config && config.upload === true;
}

export const isAuthConfig = (config: Collection<any> | BuiltCollection | CompiledCollection) =>
	config.auth === true;

export function external<T>(module: T, path: string, exportName: string = 'default'): T {
	Object.defineProperty(module, Symbol.for('external'), {
		value: { path, exportName },
		enumerable: false
	});
	return module;
}

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