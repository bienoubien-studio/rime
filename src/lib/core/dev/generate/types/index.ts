import { PACKAGE_NAME } from '$lib/core/constant.server.js';
import { logger } from '$lib/core/logger/index.server.js';
import { BlocksBuilder } from '$lib/fields/blocks/index.js';
import { FormFieldBuilder, type FieldBuilder } from '$lib/fields/builders/field.server.js';
import { GroupFieldBuilder } from '$lib/fields/group/index.js';
import { TabsBuilder } from '$lib/fields/tabs/index.js';
import { TreeBuilder } from '$lib/fields/tree/index.js';
import type { Field } from '$lib/fields/types.js';
import { isUploadConfig } from '$lib/util/config.js';
import { capitalize, toPascalCase } from '$lib/util/string.js';
import fs from 'fs';
import type { BuiltConfig, ImageSizesConfig } from '../../../../types.js';
import { makeVersionsSlug } from '../../../../util/schema.js';
import cache from '../../cache/index.js';

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
  ${content};
	[x: string]: unknown;
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
 * Generates a type for a treeBlock with the given slug and content
 * @param name the type name ex: TreeSomething
 * @param content The string representation of the treeBlock's fields
 * @returns A string containing the block type definition
 * @example
 * makeTreeBlockType('nav', 'title: string\nimage: string')
 * // returns a type definition for TreeNav
 */
const makeTreeBlockType = (name: string, content: string): string => `
export type ${name} = {
  id: string;
  ${content};
	_children: ${name}[]
}`;

/**
 * Generates the module declaration for registering document types
 * @param config The built configuration containing collections and areas
 * @returns A string containing the module declaration for type registration
 */
const templateRegister = (config: BuiltConfig): string => {
	const registerCollections = config.collections.length
		? [
				'\tinterface RegisterCollection {',
				`${config.collections
					.map((collection) => {
						let collectionRegister = `\t\t'${collection.slug}': ${makeDocTypeName(collection.slug)}`;
						if (collection.versions) {
							collectionRegister += `\n\t\t'${makeVersionsSlug(collection.slug)}': ${makeDocTypeName(collection.slug)}`;
						}
						return collectionRegister;
					})
					.join('\n')};`,
				'\t}'
			]
		: [];
	const registerAreas = config.areas.length
		? [
				'\tinterface RegisterArea {',
				`${config.areas
					.map((area) => {
						let areaRegister = `\t\t'${area.slug}': ${makeDocTypeName(area.slug)}`;
						return areaRegister;
					})
					.join('\n')};`,
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
 * Generates the complete TypeScript type definitions string based on the built configuration
 * @param config The built configuration containing collections, areas, and fields
 * @returns A string containing all type definitions
 */
export function generateTypesString(config: BuiltConfig) {
	const blocksTypes: string[] = [];
	const treeBlocksTypes: string[] = [];
	const registeredBlocks: string[] = [];
	const registeredTreeBlocks: string[] = [];
	let imports = new Set<string>(['BaseDoc', 'Navigation', 'User', 'Rizom']);

	const addImport = (string: string) => {
		imports = new Set([...imports, string]);
	};

	/**
	 * Generates fields type definitions string based on a list of field
	 * @param fields A fields configurations list
	 * @returns An array of string containing fields type definitions
	 */
	const buildFieldsTypes = (fields: FieldBuilder<Field>[]): string[] => {
		const strFields: string[] = [];

		for (const field of fields) {
			if (field instanceof FormFieldBuilder) {
				strFields.push(field._toType());
			} else if (field instanceof TabsBuilder) {
				strFields.push(field._toType());
			}
		}
		return strFields;
	};

	const buildblocksTypes = (fields: FieldBuilder<Field>[]) => {
		for (const field of fields) {
			if (field instanceof BlocksBuilder) {
				{
					for (const block of field.raw.blocks) {
						if (!registeredBlocks.includes(block.raw.name)) {
							const templates = buildFieldsTypes(block.raw.fields.filter((field) => field instanceof FormFieldBuilder));
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

	const buildTreeBlockTypes = (fields: FieldBuilder<Field>[]) => {
		for (const field of fields) {
			if (field instanceof BlocksBuilder) {
				for (const block of field.raw.blocks) {
					buildTreeBlockTypes(block.raw.fields)
				}
			} else if (field instanceof TabsBuilder) {
				for (const tab of field.raw.tabs) {
					buildTreeBlockTypes(tab.raw.fields);
				}
			} else if (field instanceof GroupFieldBuilder) {
				buildTreeBlockTypes(field.raw.fields);
			} else if (field instanceof TreeBuilder) {
				const treeBlockTypeName = `Tree${toPascalCase(field.name)}`
				if (!registeredTreeBlocks.includes(treeBlockTypeName)) {
					const treeFieldsTypes = buildFieldsTypes(field.raw.fields.filter((field) => field instanceof FormFieldBuilder))
					const treeBlockType = makeTreeBlockType(treeBlockTypeName, treeFieldsTypes.join('\n'))
					treeBlocksTypes.push(treeBlockType)
					registeredTreeBlocks.push(treeBlockTypeName);
				}
			}
		}
	};

	const processCollection = (collection: (typeof config.collections)[number]) => {
		let fields = collection.fields;
		if (isUploadConfig(collection) && collection.upload.imageSizes?.length) {
			fields = collection.fields
				.filter((f) => f instanceof FormFieldBuilder)
				.filter((field) => !collection.upload.imageSizes!.some((size) => size.name === field.raw.name));
		}
		let fieldsTypesList = buildFieldsTypes(fields);
		if (collection.versions) {
			fieldsTypesList.push('versionId: string');
		}
		let fieldsContent = fieldsTypesList.join('\n\t');
		buildTreeBlockTypes(fields);
		buildblocksTypes(fields);
		if (isUploadConfig(collection)) {
			addImport('UploadDoc');
			if (collection.upload.imageSizes?.length) {
				fieldsContent += generateImageSizesType(collection.upload.imageSizes);
			}
		}
		return templateDocType(collection.slug, fieldsContent, !!collection.upload);
	};

	const processArea = (area: (typeof config.areas)[number]) => {
		const fieldsTypesList = buildFieldsTypes(area.fields);
		if (area.versions) {
			fieldsTypesList.push('versionId: string');
		}
		buildTreeBlockTypes(area.fields);
		buildblocksTypes(area.fields);
		return templateDocType(area.slug, fieldsTypesList.join('\n\t'));
	};

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
			/** Flag only ON when create the first panel user */
			isInit?: boolean;
			/** The better auth session */
      session: Session | undefined;
			/** The rizom user document when authenticated */
      user: User | undefined;
			/**
			 * Flag enabled when a create operation is triggered
			 * by a auth/sign-up api call.
			 */
			isAutoSignIn?: boolean;
			/** The full better-auth user */
			betterAuthUser:
			| {
					id: string;
					name: string;
					email: string;
					emailVerified: boolean;
					createdAt: Date;
					updatedAt: Date;
					role?: string | null | undefined;
					banned: boolean | null | undefined;
					banReason?: string | null | undefined;
					banExpires?: Date | null | undefined;
					type: string;
				}
			| undefined;
			/** Singleton providing access to auth, config and local-api */
      rizom: Rizom;
			/** Flag enabled by the core plugin rizom.cache when the API cache is ON */
      cacheEnabled: boolean;
      /** Available in panel, routes for sidebar */
      routes: Navigation;
			/**
			 * Current locale if applicable
			 * set following this prioroty :
			 * - locale inside the url from your front-end ex: /en/foo
			 * - locale from searchParams ex : ?locale=en
			 * - locale from cookie
			 * - default locale
			*/
      locale: string | undefined;
    }
  }
}`;

	const content = [
		`import '${PACKAGE_NAME}';`,
		`import type { Session } from 'better-auth';`,
		typeImports,
		'',
		relationValueType,
		`declare global {`,
		collectionsTypes,
		areasTypes,
		treeBlocksTypes.join('\n'),
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
			logger.info('[✓] Types: generated at src/app.generated.d.ts');
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
