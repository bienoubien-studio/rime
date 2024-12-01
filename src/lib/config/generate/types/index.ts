import fs from 'fs';
import { capitalize, toPascalCase } from '$lib/utils/string.js';
import { taskLogger } from 'rizom/utils/logger/index.js';
import cache from '../cache/index.js';
import {
	isBlocksField,
	isComboBoxField,
	isDateField,
	isEmailField,
	isFormField,
	isGroupField,
	isLinkField,
	isNumberField,
	isRadioField,
	isRelationField,
	isRichTextField,
	isSelectField,
	isSlugField,
	isTabsField,
	isTextField,
	isToggleField
} from 'rizom/utils/field.js';
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
export type Block${capitalize(slug)} = {
  id: string
  type: '${slug}'
  ${content}
}`;

const templateAnyDoc = (slugs: string[]): string => {
	return `export type AnyDoc = BaseDoc & Partial<UploadDoc & ${slugs.map((slug) => makeDocTypeName(slug)).join(' & ')}>;`;
};

const templateRegister = (
	slugs: string[],
	collectionSlugs: string[],
	globalSlugs: string[]
): string => {
	return [
		"declare module 'rizom' {",
		'\tinterface Register {',
		`\t\tPrototypeSlug: ${slugs.map((slug) => `'${slug}'`).join(' | ')};`,
		`\t\tCollectionSlug: ${collectionSlugs.map((slug) => `'${slug}'`).join(' | ')};`,
		globalSlugs.length
			? `\t\tGlobalSlug: ${globalSlugs.map((slug) => `'${slug}'`).join(' | ')};`
			: '',
		'\t}',
		'}'
	].join('\n');
};

const generateTypes = (config: BuiltConfig) => {
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
				case isTextField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string,`);
					break;
				case isComboBoxField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string,`);
					break;
				case isEmailField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string,`);
					break;
				case isToggleField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: boolean,`);
					break;
				case isRelationField(field): {
					const docType = `${toPascalCase(field.relationTo)}Doc`;
					strFields.push(
						`${field.name}${field.required ? '' : '?'}: ${docType}[] | { id?: string; relationTo: string; relationId: string; }[],`
					);
					break;
				}
				case isRadioField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string,`);
					break;
				case isLinkField(field):
					addImport('Link');
					strFields.push(`${field.name}${field.required ? '' : '?'}: Link,`);
					break;
				case isSelectField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string[],`);
					break;
				case isSlugField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: string,`);
					break;
				case isDateField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: Date,`);
					break;
				case isRichTextField(field):
					addImport('RichTextNode');
					strFields.push(`${field.name}${field.required ? '' : '?'}: { content: RichTextNode[] },`);
					break;
				case isBlocksField(field):
					for (const block of field.blocks) {
						if (!registeredBlocks.includes(block.name)) {
							const templates = convertFieldsToTypesTemplates(
								block.fields.filter(isFormField).filter((f) => f.name !== 'type')
							);
							blocksTypes.push(makeBlockType(block.name, templates.join('\n\t')));
							registeredBlocks.push(block.name);
						}
					}
					strFields.push(`${field.name}: AnyBlock[],`);
					break;
				case isNumberField(field):
					strFields.push(`${field.name}${field.required ? '' : '?'}: number,`);
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
	const prototypeSlugs = [...collectionSlugs, ...globalSlugs];

	const docType = templateAnyDoc(prototypeSlugs);
	const docTables = templateRegister(prototypeSlugs, collectionSlugs, globalSlugs);

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
		collectionsTypes,
		globalsTypes,
		docType,
		docTables,
		blocksTypes.join('\n'),
		hasBlocks ? blocksTypeNames : '',
		hasBlocks ? anyBlock : '',
		locals
	].join('\n');

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
			console.log('');
		}
	});
};

export default generateTypes;
