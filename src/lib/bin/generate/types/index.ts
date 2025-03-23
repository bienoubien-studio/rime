import fs from 'fs';
import { capitalize, toPascalCase } from '$lib/util/string.js';
import { taskLogger } from 'rizom/util/logger/index.js';
import cache from '../cache/index.js';
import { isBlocksField, isGroupField, isTabsField, isTreeFieldRaw } from 'rizom/util/field.js';
import type { Field } from 'rizom/types/fields.js';
import type { BuiltConfig, ImageSizesConfig } from 'rizom/types/config.js';
import { PACKAGE_NAME } from 'rizom/constant.js';
import { FormFieldBuilder, type FieldBuilder } from 'rizom/fields/builders/field.js';
import { isUploadConfig } from 'rizom/util/config.js';
import { TabsBuilder } from 'rizom/fields/tabs/index.js';
import { TreeBuilder } from 'rizom/fields/tree/index.js';
import { GroupFieldBuilder } from 'rizom/fields/group/index.js';

/* -------------------------------------------------------------------------- */
/*                              Schema Templates                              */
/* -------------------------------------------------------------------------- */

const makeDocTypeName = (slug: string): string => `${capitalize(slug)}Doc`;

const templateDocType = (slug: string, content: string, upload?: boolean): string => `
export type ${makeDocTypeName(slug)} = BaseDoc & ${upload ? 'UploadDoc & ' : ''} {
  ${content}
}`;

const makeBlockType = (slug: string, content: string): string => `
export type Block${toPascalCase(slug)} = {
  id: string
  type: '${slug}'
  ${content}
}`;

const templateRegister = (collectionSlugs: string[], areaSlugs: string[]): string => {
	const registerCollections = collectionSlugs.length
		? [
			'\tinterface RegisterCollection {',
			`${collectionSlugs.map((slug) => `\t\t'${slug}': ${makeDocTypeName(slug)}`).join('\n')};`,
			'\t}'
		]
		: [];
	const registerAreas = areaSlugs.length
		? [
			'\tinterface RegisterArea {',
			`${areaSlugs.map((slug) => `\t\t'${slug}': ${makeDocTypeName(slug)}`).join('\n')};`,
			'\t}'
		]
		: [];
	return ["declare module 'rizom' {", ...registerCollections, ...registerAreas, '}'].join('\n');
};

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
export function generateTypesString(config: BuiltConfig) {
	const blocksTypes: string[] = [];
	const registeredBlocks: string[] = [];
	let imports = new Set<string>(['BaseDoc', 'LocalAPI', 'Navigation', 'User', 'Rizom']);

	const addImport = (string: string) => {
		imports = new Set([...imports, string]);
	};

	const buildFieldsTypes = (fields: FieldBuilder<Field>[]): string[] => {
		let strFields: string[] = [];

		for (const field of fields) {
			if (field instanceof FormFieldBuilder) {
				strFields.push(field.toType());
			} else if (field instanceof TabsBuilder) {
				strFields.push(field.toType());
			}
		}

		return strFields;
	};

	const buildblocksTypes = (fields: FieldBuilder<Field>[]) => {
		for (const field of fields) {
			if (isBlocksField(field.raw)) {
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

	const relationValueType = `
export type RelationValue<T> =
	| T[] // When depth > 0, fully populated docs
	| { id?: string; relationTo: string; relationId: string }[] // When depth = 0, relation objects
	| string[]
	| string; // When sending data to updateById`;

	const collectionsTypes = config.collections
		.map((collection) => {
			let fields = collection.fields;
			if (isUploadConfig(collection) && collection.imageSizes?.length) {
				fields = collection.fields
					.filter((f) => f instanceof FormFieldBuilder)
					.filter((field) => !collection.imageSizes!.some((size) => size.name === field.raw.name));
			}
			let fieldsContent = buildFieldsTypes(fields).join('\n\t');
			buildblocksTypes(fields);
			if (isUploadConfig(collection)) {
				addImport('UploadDoc');
				if (collection.imageSizes?.length) {
					fieldsContent += generateImageSizesType(collection.imageSizes);
				}
			}
			return templateDocType(collection.slug, fieldsContent, collection.upload);
		})
		.join('\n');

	const areasTypes = config.areas
		.map((area) => {
			const fieldsContent = buildFieldsTypes(area.fields);
			buildblocksTypes(area.fields);
			return templateDocType(area.slug, fieldsContent.join('\n\t'));
		})
		.join('\n');

	const collectionSlugs = config.collections.map((c) => c.slug);
	const areaSlugs = config.areas.map((g) => g.slug);

	// const docType = templateAnyDoc(prototypeSlugs);
	const register = templateRegister(collectionSlugs, areaSlugs);

	const hasBlocks = !!registeredBlocks.length;
	const blocksTypeNames = `export type BlockTypes = ${registeredBlocks.map((name) => `'${name}'`).join('|')}\n`;
	const anyBlock = `export type AnyBlock = ${registeredBlocks.map((name) => `Block${toPascalCase(name)}`).join('|')}\n`;
	const typeImports = `import type { ${Array.from(imports).join(', ')} } from '${PACKAGE_NAME}'`;

	const locals = `declare global {
  namespace App {
    interface Locals {
      session: Session | undefined;
      user: User | undefined;
      rizom: Rizom;
      api: LocalAPI;
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

function generateTypes(config: BuiltConfig) {
	write(generateTypesString(config));
}

export default generateTypes;
