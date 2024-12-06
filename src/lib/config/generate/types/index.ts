import fs from 'fs';
import { capitalize, toPascalCase } from '$lib/utils/string.js';
import { taskLogger } from 'rizom/utils/logger/index.js';
import cache from '../cache/index.js';
import { isBlocksField, isFormField, isGroupField, isTabsField } from 'rizom/utils/field.js';
import type { AnyField } from 'rizom/types/fields.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import { PACKAGE_NAME } from 'rizom/constant.js';

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

const templateRegister = (collectionSlugs: string[], globalSlugs: string[]): string => {
	return [
		"declare module 'rizom' {",
		'\tinterface RegisterCollection {',
		`${collectionSlugs.map((slug) => `\t\t'${slug}': ${makeDocTypeName(slug)}`).join('\n')};`,
		'\t}',

		'\tinterface RegisterGlobal {',
		`${globalSlugs.map((slug) => `\t\t'${slug}': ${makeDocTypeName(slug)}`).join('\n')};`,
		'\t}',

		'}'
	].join('\n');
};

export function generateTypesString(config: BuiltConfig) {
	const blocksTypes: string[] = [];
	const registeredBlocks: string[] = [];
	let imports = new Set<string>(['BaseDoc', 'LocalAPI', 'Navigation', 'User', 'Rizom']);

	const addImport = (string: string) => {
		imports = new Set([...imports, string]);
	};

	const convertFieldsToTypesTemplates = (fields: AnyField[]): string[] => {
		let strFields: string[] = [];

		for (const field of fields) {
			switch (true) {
				case field.type in config.blueprints && !!config.blueprints[field.type].toType:
					strFields.push(config.blueprints[field.type].toType!(field));
					break;
				case isBlocksField(field):
					{
						for (const block of field.blocks) {
							if (!registeredBlocks.includes(block.name)) {
								const templates = convertFieldsToTypesTemplates(
									block.fields.filter(isFormField).filter((f) => f.name !== 'type')
								);
								blocksTypes.push(makeBlockType(block.name, templates.join('\n\t')));
								registeredBlocks.push(block.name);
							}
						}
						const blockNames = field.blocks.map((block) => `Block${toPascalCase(block.name)}`);
						strFields.push(`${field.name}: Array<${blockNames.join(' | ')}>,`);
					}
					break;
				case isGroupField(field): {
					const templates = convertFieldsToTypesTemplates(field.fields);
					strFields = [...strFields, ...templates];
					break;
				}
				case isTabsField(field):
					for (const tab of field.tabs) {
						const templates = convertFieldsToTypesTemplates(tab.fields);
						strFields = [...strFields, ...templates];
					}
			}
		}
		return strFields;
	};

	const relationValueType = `export type RelationValue<T> =
		| T[] // When depth > 0, fully populated docs
		| { id?: string; relationTo: string; relationId: string }[] // When depth = 0, relation objects
		| string[]
		| string; // When sending data to updateById`;

	const collectionsTypes = config.collections
		.map((collection) => {
			const fieldsContent = convertFieldsToTypesTemplates(collection.fields).join('\n\t');
			if (collection.upload) {
				addImport('UploadDoc');
			}
			return templateDocType(collection.slug, fieldsContent, collection.upload);
		})
		.join('\n');

	const globalsTypes = config.globals
		.map((global) =>
			templateDocType(global.slug, convertFieldsToTypesTemplates(global.fields).join('\n\t'))
		)
		.join('\n');

	const collectionSlugs = config.collections.map((c) => c.slug);
	const globalSlugs = config.globals.map((g) => g.slug);

	// const docType = templateAnyDoc(prototypeSlugs);
	const register = templateRegister(collectionSlugs, globalSlugs);

	const hasBlocks = !!registeredBlocks.length;
	const blocksTypeNames = `export type BlockTypes = ${registeredBlocks.map((name) => `'${name}'`).join('|')}\n`;
	const anyBlock = `export type AnyBlock = ${registeredBlocks.map((name) => `Block${toPascalCase(name)}`).join('|')}\n`;
	const typeImports = `import type { ${Array.from(imports).join(', ')} } from '${PACKAGE_NAME}'`;

	const locals = `declare global {
  namespace App {
    interface Locals {
      session: import('lucia').Session | undefined;
      user: User | undefined;
      rizom: Rizom;
      api: LocalAPI;
      /** Available in panel, routes for sidebar */
      routes: Navigation;
      locale: string | undefined;
    }
  }
}`;

	const content = [
		`import '${PACKAGE_NAME}';`,
		typeImports,
		relationValueType,
		collectionsTypes,
		globalsTypes,
		blocksTypes.join('\n'),
		hasBlocks ? blocksTypeNames : '',
		hasBlocks ? anyBlock : '',
		locals,
		register
	].join('\n');

	return content;
}

function write(content: string) {
	const cachedTypes = cache.get('types');

	if (cachedTypes && cachedTypes === content) {
		// taskLogger.info('-  types    :: No change detected');
		return;
	} else {
		cache.set('types', content);
	}

	fs.writeFile('./src/app.generated.d.ts', content, (err) => {
		if (err) {
			console.error(err);
		} else {
			taskLogger.done('Types: generated at src/app.generated.d.ts');
			// console.log('');
		}
	});
}

function generateTypes(config: BuiltConfig) {
	write(generateTypesString(config));
}

export default generateTypes;
