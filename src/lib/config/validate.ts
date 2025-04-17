import {
	isBlocksFieldRaw,
	isFormField,
	isGroupFieldRaw,
	isTabsFieldRaw,
	isTreeFieldRaw
} from '../util/field.js';
import { isAuthConfig } from '$lib/util/config.js';
import cache from '$lib/bin/generate/cache/index.js';
import type { CompiledCollection, CompiledArea, CompiledConfig } from '$lib/types/config.js';
import type { PrototypeSlug } from '$lib/types/doc.js';
import type { FormField } from '$lib/types/fields.js';
import type { BlocksFieldRaw } from '$lib/fields/blocks/index.js';
import { PANEL_USERS } from '$lib/constant.js';

function hasDuplicates(arr: string[]): string[] {
	return [...new Set(arr.filter((e, i, a) => a.indexOf(e) !== i))];
}

function hasDuplicateSlug(config: CompiledConfig) {
	const slugs: PrototypeSlug[] = [];
	for (const collection of config.collections) {
		slugs.push(collection.slug);
	}
	for (const area of config.areas) {
		slugs.push(area.slug);
	}

	const duplicates = hasDuplicates(slugs);
	if (duplicates.length) {
		return ['Duplicated collection/area slugs :' + duplicates.join(', ')];
	}
	return [];
}

function hasUsersSlug(config: CompiledConfig) {
	const invalid = config.collections.filter((collection) => collection.slug === PANEL_USERS).length > 1;
	if (invalid) {
		return [`${PANEL_USERS} is a reserved slug for panel users`];
	}
	return [];
}

const validateFields = (config: CompiledConfig) => {
	let errors: string[] = [];
	for (const collection of config.collections) {
		const collectionErrors = validateDocumentFields(collection);
		errors = [...errors, ...collectionErrors];
	}
	for (const area of config.areas) {
		const collectionErrors = validateDocumentFields(area);
		errors = [...errors, ...collectionErrors];
	}
	return errors;
};

type UnknownConfig = CompiledCollection | CompiledArea;

const validateDocumentFields = (config: UnknownConfig) => {
	const errors: string[] = [];
	const isCollection = (config: UnknownConfig): config is CompiledCollection =>
		config.type === 'collection';
	const isAuth = isCollection(config) && isAuthConfig(config);
	const registeredBlocks: Record<string, BlocksFieldRaw['blocks'][number]> = {};

	if (isAuth) {
		const hasRolesField = config.fields
			.filter(isFormField)
			.find((f) => f.name === 'roles' && f.type === 'select');
		const hasEmailField = config.fields
			.filter(isFormField)
			.find((f: FormField) => f.name === 'email' && f.type === 'email');
		if (!hasRolesField) errors.push(`Field roles is missing in collection ${config.slug}`);
		if (!hasEmailField) errors.push(`Field email is missing in collection ${config.slug}`);
	}

	const validateBlockField = (fields: FormField[], blockType: string) => {
		const reserved = ['path', 'type', 'ownerId', 'position'];
		for (const key of reserved) {
			if (fields.map((f) => f.name).filter((name) => name === key).length > 1) {
				errors.push(`${key} is a reserved field in blocks (block ${blockType})`);
			}
		}
	};

	const validateFormFields = (fields: FormField[]) => {
		// Check for field name duplication at this level
		const duplicates = hasDuplicates(fields.map((f) => f.name));
		if (duplicates.length) {
			for (const duplicate of duplicates) {
				errors.push(`Duplicate schema field ${duplicate} in ${config.type} ${config.slug}`);
			}
		}

		function validateFieldName(name: string): boolean {
			// Regular expression to match
			// __group_foo__truc, fooBlablaBla, _hello_guys
			const pattern = /^(__)?[a-zA-Z][a-zA-Z0-9_]*$/;
			// Check if string matches pattern and doesn't contain spaces or hyphens
			return pattern.test(name) && !name.includes('-') && !name.includes(' ');
		}

		for (const field of fields) {
			// Check for malformed field.name
			if (!validateFieldName(field.name)) {
				errors.push(`Field ${field.name} of ${config.type} ${config.slug} should be camelCase`);
			}

			// Recursive check into Blocks Groups and Tabs
			if (isBlocksFieldRaw(field)) {
				for (const block of field.blocks) {
					if (block.name in registeredBlocks) {
						const blockDefinedButDiffer =
							JSON.stringify(registeredBlocks[block.name]) !== JSON.stringify(block);
						if (blockDefinedButDiffer) {
							errors.push(`Each block with same name should be identique (block ${block.name})`);
						}
					} else {
						registeredBlocks[block.name] = block;
					}
					validateFormFields(block.fields.filter(isFormField));
					validateBlockField(block.fields.filter(isFormField), block.name);
				}
			} else if (isTreeFieldRaw(field)) {
				validateFormFields(field.fields.filter(isFormField));
			} else if (isTabsFieldRaw(field)) {
				for (const tab of field.tabs) {
					validateFormFields(tab.fields.filter(isFormField));
				}
			} else if (isGroupFieldRaw(field)) {
				validateFormFields(field.fields.filter(isFormField));
			}
		}
	};

	validateFormFields(config.fields.filter(isFormField));

	return errors;
};

const hasDatabase = (config: CompiledConfig) => {
	const hasDatabaseName = 'database' in config && typeof config.database === 'string';
	if (!hasDatabaseName) {
		return ['config.database not defined'];
	}
	return [];
};

// function validateUploadCollections(config: CompiledConfig) {
// 	let errors = [];
// 	const uploadCollections = config.collections.filter(isUploadConfig);
// 	for (const collection of uploadCollections) {
// 		const hasImageSizes = 'imageSizes' in collection;
// 		const hasPanelThumbnail = 'panelThumbnail' in collection;
// 		if (!hasImageSizes) {
// 			errors.push(`collection.imagesSizes of ${collection.slug} should be defined`);
// 		}
// 		if (!hasPanelThumbnail) {
// 			errors.push(`collection.hasPanelThumbnail of ${collection.slug} should be defined`);
// 		}
// 	}
// 	return errors;
// }

function validate(config: CompiledConfig): boolean {
	const validateFunctions = [
		hasDuplicateSlug,
		hasUsersSlug,
		validateFields,
		hasDatabase
		// validateUploadCollections
	];

	for (const isValid of validateFunctions) {
		const errors: string[] = isValid(config);
		if (errors.length) {
			cache.clear();
			throw new Error('Config error : ' + errors[0]);
		}
	}

	return true;
}

export default validate;
