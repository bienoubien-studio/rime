import fs from 'fs';
import { capitalize, toPascalCase } from '$lib/util/string.js';
import cache from '../../cache/index.js';
import type { Field } from '$lib/fields/types.js';
import { FormFieldBuilder, type FieldBuilder } from '$lib/fields/builders/field.js';
import { isUploadConfig } from '$lib/util/config.js';
import { TabsBuilder } from '$lib/fields/tabs/index.js';
import { TreeBuilder } from '$lib/fields/tree/index.js';
import { GroupFieldBuilder } from '$lib/fields/group/index.js';
import { makeVersionsTableName } from '../../../../util/schema.js';
import { BlocksBuilder } from '$lib/fields/blocks/index.js';
import type { BuiltConfig, ImageSizesConfig } from '../../../../types.js';
import { PACKAGE_NAME } from '$lib/core/constant.js';
import { taskLogger } from '$lib/core/logger/index.server.js';

// Relation  type
const relationValueType = `
export type RelationValue<T> =
	| T[] // When depth > 0, fully populated docs
	| { id?: string; relationTo: string; documentId: string }[] // When depth = 0, relation objects
	| string[]
	| string; // When sending data to update`;

/**
 * Generate document's type name
 * @param slug the slug of the area/collection 
 * @returns the type name for this document
 * @example
 * makeDocTypeName('pages')
 * // return PagesDoc
 */
const makeDocTypeName = (slug: string): string => `${capitalize(slug)}Doc`;

/**
 * Generate the document's type definition
 * @param slug the collection/area slug
 * @param content a string of all types properties 
 * @param upload a boolean flag for upload colections
 * @returns the full document type
 */
const templateDocType = (slug: string, content: string, upload?: boolean): string => `
export type ${makeDocTypeName(slug)} = BaseDoc & ${upload ? 'UploadDoc & ' : ''} {
  ${content}
}`;

/**
 * Generates a type for a block with the given slug and content
 * @param slug The unique identifier for the block
 * @param content The string representation of the block's properties
 * @returns A string containing the block type definition
 * @example
 * makeBlockType('hero', 'title: string\nimage: string')
 * // returns a type definition for BlockHero
 */
const makeBlockType = (slug: string, content: string): string => `
export type Block${toPascalCase(slug)} = {
  id: string
  type: '${slug}'
  ${content}
}`;

/**
 * Generates the module declaration for registering document types
 * @param config The built configuration containing collections and areas
 * @returns A string containing the module declaration for type registration
 */
const templateRegister = (config:BuiltConfig): string => {
	const registerCollections = config.collections.length
		? [
				'\tinterface RegisterCollection {',
				`${config.collections.map((collection) => {
					let collectionRegister = `\t\t'${collection.slug}': ${makeDocTypeName(collection.slug)}`
					if(collection.versions){
						collectionRegister += `\n\t\t'${makeVersionsTableName(collection.slug)}': ${makeDocTypeName(collection.slug)}`
					}
					return collectionRegister
				}).join('\n')};`,
				'\t}'
			]
		: [];
	const registerAreas = config.areas.length
		? [
				'\tinterface RegisterArea {',
				`${config.areas.map((area) => {
					let areaRegister = `\t\t'${area.slug}': ${makeDocTypeName(area.slug)}`
					return areaRegister
				}).join('\n')};`,
				'\t}'
			]
		: [];
	return ["declare module 'rizom' {", ...registerCollections, ...registerAreas, '}'].join('\n');
};


/**
 * Generates type definitions for image sizes
 * @param sizes Array of image size configurations
 * @returns A string containing the type definition for image sizes
 */
function generateImageSizesType(sizes: ImageSizesConfig[]) {
	const sizesTypes = sizes
		.map((size) => {
			if (size.out && size.out.length > 1) {
				return size.out.map((format) => `${size.name}_${format}: string`).join(', ');
			} else {
				return `${size.name}: string`;
			}
		})
		.join(', ');
	return `\n\t\tsizes:{${sizesTypes}}`;
}

/**
 * Generates fields type definitions string based on a list of field
 * @param fields A fields configurations list
 * @returns An array of string containing fields type definitions
 */
const buildFieldsTypes = (fields: FieldBuilder<Field>[]): string[] => {
	const strFields: string[] = [];

	for (const field of fields) {
		if (field instanceof FormFieldBuilder) {
			strFields.push(field.toType());
		} else if (field instanceof TabsBuilder) {
			strFields.push(field.toType());
		}
	}
	return strFields;
};

/**
 * Generates the complete TypeScript type definitions string based on the built configuration
 * @param config The built configuration containing collections, areas, and fields
 * @returns A string containing all type definitions
 */
export function generateTypesString(config: BuiltConfig) {
	const blocksTypes: string[] = [];
	const registeredBlocks: string[] = [];
	let imports = new Set<string>(['BaseDoc', 'Navigation', 'User', 'Rizom']);

	const addImport = (string: string) => {
		imports = new Set([...imports, string]);
	};

	const buildblocksTypes = (fields: FieldBuilder<Field>[]) => {
		for (const field of fields) {
			if (field instanceof BlocksBuilder) {
				{
					for (const block of field.raw.blocks) {
						if (!registeredBlocks.includes(block.raw.name)) {
							const templates = buildFieldsTypes(
								block.raw.fields.filter((field) => field instanceof FormFieldBuilder)
							);
							blocksTypes.push(makeBlockType(block.raw.name, templates.join('\n\t')));
							registeredBlocks.push(block.raw.name);
						}
					}
				}
			} else if (field instanceof TabsBuilder) {
				for (const tab of field.raw.tabs) {
					buildblocksTypes(tab.raw.fields);
				}
			} else if (field instanceof GroupFieldBuilder) {
				buildblocksTypes(field.raw.fields);
			} else if (field instanceof TreeBuilder) {
				buildblocksTypes(field.raw.fields);
			}
		}
	};
	
	const processCollection = (collection: typeof config.collections[number]) => {
		let fields = collection.fields;
			if (isUploadConfig(collection) && collection.imageSizes?.length) {
				fields = collection.fields
					.filter((f) => f instanceof FormFieldBuilder)
					.filter((field) => !collection.imageSizes!.some((size) => size.name === field.raw.name));
			}
			let fieldsTypesList = buildFieldsTypes(fields);
			if(collection.versions){
				fieldsTypesList.push('versionId: string')
			}
			let fieldsContent = fieldsTypesList.join('\n\t')
			buildblocksTypes(fields);
			if (isUploadConfig(collection)) {
				addImport('UploadDoc');
				if (collection.imageSizes?.length) {
					fieldsContent += generateImageSizesType(collection.imageSizes);
				}
			}
			return templateDocType(collection.slug, fieldsContent, collection.upload);
	}

	const processArea = (area: typeof config.areas[number]) => {
		const fieldsTypesList = buildFieldsTypes(area.fields);
			if(area.versions){
				fieldsTypesList.push('versionId: string')
			}
			buildblocksTypes(area.fields);
			return templateDocType(area.slug, fieldsTypesList.join('\n\t'));
	}

	const register = templateRegister(config);
	const collectionsTypes = config.collections.map(processCollection).join('\n');
	const areasTypes = config.areas.map(processArea).join('\n');
	const hasBlocks = !!registeredBlocks.length;
	const blocksTypeNames = `export type BlockTypes = ${registeredBlocks.map((name) => `'${name}'`).join('|')}\n`;
	const anyBlock = `export type AnyBlock = ${registeredBlocks.map((name) => `Block${toPascalCase(name)}`).join('|')}\n`;
	const typeImports = `import type { ${Array.from(imports).join(', ')} } from '${PACKAGE_NAME}/types'`;

	const locals = `declare global {
  namespace App {
    interface Locals {
      session: Session | undefined;
      user: User | undefined;
      rizom: Rizom;
      cacheEnabled: boolean;
      /** Available in panel, routes for sidebar */
      routes: Navigation;
      locale: string | undefined;
    }
  }
}`;

	const content = [
		`import '${PACKAGE_NAME}';`,
		`import type { Session } from 'better-auth';`,
		typeImports,
		relationValueType,
		`declare global {`,
		collectionsTypes,
		areasTypes,
		blocksTypes.join('\n'),
		hasBlocks ? blocksTypeNames : '',
		hasBlocks ? anyBlock : '',
		`}`,
		locals,
		register
	].join('\n');

	return content;
}

/**
 * Writes the generated types to the app.generated.d.ts file
 * @param content The string containing all type definitions
 */
function write(content: string) {
	const cachedTypes = cache.get('types');

	if (cachedTypes && cachedTypes === content) {
		return;
	} else {
		cache.set('types', content);
	}

	fs.writeFile('./src/app.generated.d.ts', content, (err) => {
		if (err) {
			console.error(err);
		} else {
			taskLogger.done('Types: generated at src/app.generated.d.ts');
		}
	});
}

/**
 * Generates and writes TypeScript type definitions based on the built configuration
 * @param config The built configuration containing collections, areas, and fields
 */
function generateTypes(config: BuiltConfig) {
	write(generateTypesString(config));
}

export default generateTypes;
