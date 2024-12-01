import type { BlocksFieldBlock } from 'rizom/fields/types';
import cache from './generate/cache';
import { taskLogger } from 'rizom/utils/logger';
import { isBlocksField, isFormField, toFormFields } from '../utils/field';
import { isAuthConfig } from './utils';
import type { BuiltCollectionConfig, BuiltConfig, BuiltGlobalConfig } from 'rizom/types/config';
import type { AnyFormField } from 'rizom/types';

function hasDuplicates(arr: string[]): string[] {
	return [...new Set(arr.filter((e, i, a) => a.indexOf(e) !== i))];
}

function hasDuplicateSlug(config: BuiltConfig) {
	const slugs = [];
	for (const collection of config.collections) {
		slugs.push(collection.slug);
	}
	for (const global of config.globals) {
		slugs.push(global.slug);
	}

	const duplicates = hasDuplicates(slugs);
	if (duplicates.length) {
		return ['Duplicated collection/global slugs :' + duplicates.join(', ')];
	}
	return [];
}

function hasUsersSlug(config: BuiltConfig) {
	const invalid = config.collections.filter((collection) => collection.slug === 'users').length > 1;
	if (invalid) {
		return ['"users" is a reserved slug for panel users'];
	}
	return [];
}

const validateFields = (config: BuiltConfig) => {
	let errors: string[] = [];
	for (const collection of config.collections) {
		const collectionErrors = validateDocumentFields(collection);
		errors = [...errors, ...collectionErrors];
	}
	for (const global of config.globals) {
		const collectionErrors = validateDocumentFields(global);
		errors = [...errors, ...collectionErrors];
	}
	return errors;
};

type UnknownConfig = BuiltCollectionConfig | BuiltGlobalConfig;

const validateDocumentFields = (config: UnknownConfig) => {
	const errors: string[] = [];
	const isCollection = (config: UnknownConfig): config is BuiltCollectionConfig =>
		config.type === 'collection';
	const isAuth = isCollection(config) && isAuthConfig(config);
	const registeredBlocks: Record<string, BlocksFieldBlock> = {};

	if (isAuth) {
		const hasRolesField = config.fields
			.filter(isFormField)
			.find((f: AnyFormField) => f.name === 'roles' && f.type === 'select');
		const hasEmailField = config.fields
			.filter(isFormField)
			.find((f: AnyFormField) => f.name === 'email' && f.type === 'email');
		if (!hasRolesField) errors.push(`Field roles is missing in collection ${config.slug}`);
		if (!hasEmailField) errors.push(`Field email is missing in collection ${config.slug}`);
	}

	const validateBlockField = (fields: AnyFormField[], blockType: string) => {
		const reserved = ['path', 'type', 'parentId', 'position'];
		for (const key of reserved) {
			if (fields.map((f) => f.name).filter((name) => name === key).length > 1) {
				errors.push(`${key} is a reserved field in blocks (block ${blockType})`);
			}
		}
	};

	const validateFormFields = (fields: AnyFormField[]) => {
		const duplicates = hasDuplicates(fields.map((f) => f.name));
		if (duplicates.length) {
			for (const duplicate of duplicates) {
				errors.push(`Duplicate field ${duplicate} in ${config.type} ${config.slug}`);
			}
		}
		for (const field of fields) {
			if (isBlocksField(field)) {
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
			}
		}
	};

	const formFields = config.fields.reduce(toFormFields, []);
	validateFormFields(formFields);

	return errors;
};

function validate(config: BuiltConfig): boolean {
	const validateFunctions = [hasDuplicateSlug, hasUsersSlug, validateFields];

	for (const isValid of validateFunctions) {
		const errors: string[] = isValid(config);
		if (errors.length) {
			cache.set('error', errors.join('\n'));
			for (const message of errors) {
				taskLogger.error('Config error: ' + message);
			}
			return false;
		} else {
			cache.delete('error');
		}
	}

	taskLogger.done('Config is valid');

	return true;
}

export default validate;
