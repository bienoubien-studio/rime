import type { BlocksFieldBlock } from 'rizom/fields/types';
import { isFormField, toFormFields } from '../utils/field';
import { isAuthConfig, isUploadConfig } from './utils';
import type {
	CompiledCollectionConfig,
	CompiledGlobalConfig,
	CompiledConfig
} from 'rizom/types/config';
import type { AnyFormField, PrototypeSlug } from 'rizom/types';
import cache from 'rizom/bin/generate/cache';

function hasDuplicates(arr: string[]): string[] {
	return [...new Set(arr.filter((e, i, a) => a.indexOf(e) !== i))];
}

function hasDuplicateSlug(config: CompiledConfig) {
	const slugs: PrototypeSlug[] = [];
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

function hasUsersSlug(config: CompiledConfig) {
	const invalid = config.collections.filter((collection) => collection.slug === 'users').length > 1;
	if (invalid) {
		return ['"users" is a reserved slug for panel users'];
	}
	return [];
}

const validateFields = (config: CompiledConfig) => {
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

type UnknownConfig = CompiledCollectionConfig | CompiledGlobalConfig;

const validateDocumentFields = (config: UnknownConfig) => {
	const errors: string[] = [];
	const isCollection = (config: UnknownConfig): config is CompiledCollectionConfig =>
		config.type === 'collection';
	const isAuth = isCollection(config) && isAuthConfig(config);
	const registeredBlocks: Record<string, BlocksFieldBlock<'compiled'>> = {};

	if (isAuth) {
		const hasRolesField = config.fields
			.filter(isFormField)
			.find((f) => f.name === 'roles' && f.type === 'select');
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
			if (field.type === 'blocks') {
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

const hasDatabase = (config: CompiledConfig) => {
	const hasDatabaseName = 'database' in config && typeof config.database === 'string';
	if (!hasDatabaseName) {
		return ['config.database not defined'];
	}
	return [];
};

function validateUploadCollections(config: CompiledConfig) {
	let errors = [];
	const uploadCollections = config.collections.filter(isUploadConfig);
	for (const collection of uploadCollections) {
		const hasImageSizes = 'imageSizes' in collection;
		const hasPanelThumbnail = 'panelThumbnail' in collection;
		if (!hasImageSizes) {
			errors.push(`collection.imagesSizes of ${collection.slug} should be defined`);
		}
		if (!hasPanelThumbnail) {
			errors.push(`collection.hasPanelThumbnail of ${collection.slug} should be defined`);
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
		validateUploadCollections
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
