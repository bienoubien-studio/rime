import { isBlocksFieldRaw, isFormField, isGroupFieldRaw, isSelectField, isTabsFieldRaw, isTreeFieldRaw } from '../../util/field.js';
import { isAuthConfig } from '$lib/util/config.js';
import cache from '$lib/core/dev/cache/index.js';
import type { CompiledCollection, CompiledArea, CompiledConfig } from '$lib/core/config/types.js';
import type { PrototypeSlug } from '$lib/core/types/doc.js';
import type { FormField } from '$lib/fields/types.js';
import type { BlocksFieldRaw } from '$lib/fields/blocks/index.js';
import { PANEL_USERS } from '$lib/core/collections/auth/constant.server.js';

function hasDuplicates(arr: string[]): string[] {
	return [...new Set(arr.filter((e, i, a) => a.indexOf(e) !== i))];
}

/**
 * Check if there are multiple occurences
 * of the same slug inside collections and areas
 */
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

/**
 * Prevent the panel user collection slug
 * to be used elsewhere
 */
function hasUsersSlug(config: CompiledConfig) {
	const invalid = config.collections.filter((collection) => collection.slug === PANEL_USERS).length > 1;
	if (invalid) {
		return [`${PANEL_USERS} is a reserved slug for panel users`];
	}
	return [];
}

/**
 * Validate documents fields for each collections
 * and areas
 */
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

/**
 * 
 */
const validateDocumentFields = (config: UnknownConfig) => {
	const errors: string[] = [];
	const isCollection = (config: UnknownConfig): config is CompiledCollection => config.type === 'collection';
	const isAuth = isCollection(config) && isAuthConfig(config);
	const registeredBlocks: Record<string, BlocksFieldRaw['blocks'][number]> = {};

	if (isAuth) {
		const rolesField = config.fields.filter(isFormField).filter(f => f.name === 'roles').filter((f) => isSelectField(f))[0];
		const nameField = config.fields.filter(isFormField).filter(f => f.name === 'name')[0];
		const emailField = config.fields
			.filter(isFormField)
			.find((f: FormField) => f.name === 'email' && f.type === 'email');

		if (!rolesField) errors.push(`Field roles is missing in collection ${config.slug}`);
		if (!emailField && config.auth.type !== 'apiKey') errors.push(`Field email is missing in collection ${config.slug}`);
		if (!nameField) errors.push(`Field name is missing in collection ${config.slug}`);
		if(!rolesField.many) errors.push(`Field roles must have "many" enabled : select('roles').options(...).many(), even with a single option`);
	}

	const validateBlockField = (fields: FormField[], blockType: string) => {
		const reserved = ['path', 'type', 'ownerId', 'position', 'locale'];
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
				errors.push(`Duplicate field '${duplicate}' in ${config.type} '${config.slug}'`);
			}
		}

		function validateFieldName(name: string): boolean {
			// Regular expression to match
			// __group_foo__truc, fooBlablaBla, _hello_guys
			const pattern = /^(_+)?[a-zA-Z][a-zA-Z0-9_]*$/;
			// Check if string matches pattern and doesn't contain spaces or hyphens
			return pattern.test(name) && !name.includes('-') && !name.includes(' ');
		}

		for (const field of fields) {
			// Check that a field wich has field._root = true is not localized
			if ('_root' in field && field._root && field.localized) {
				errors.push(`Field ${field.name} of ${config.type} ${config.slug} with _root = true, can't be localized`);
			}

			// Check for malformed field.name
			if (!validateFieldName(field.name)) {
				errors.push(`Field ${field.name} of ${config.type} ${config.slug} should be camelCase`);
			}

			// Recursive check into Blocks Groups and Tabs
			if (isBlocksFieldRaw(field)) {
				for (const block of field.blocks) {
					if (block.name in registeredBlocks) {
						const blockDefinedButDiffer = JSON.stringify(registeredBlocks[block.name]) !== JSON.stringify(block);
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

function validateAuthCollections(config: CompiledConfig) {
	let errors = [];
	const authCollections = config.collections.filter(isAuthConfig);
	for (const collection of authCollections) {
		if (collection.versions) {
			errors.push(`Auth collections can't be versionned (${collection.slug})`);
		}
	}
	return errors;
}

function validate(config: CompiledConfig): boolean {
	const validateFunctions = [
		hasDuplicateSlug,
		hasUsersSlug,
		validateFields,
		hasDatabase,
		validateAuthCollections
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
