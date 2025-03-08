import type { AnyField, Field, FormField } from 'rizom/types/fields.js';
import {
	isBlocksField,
	isFormField,
	isGroupField,
	isRelationField,
	isTabsField
} from 'rizom/util/field.js';
import { toPascalCase } from '$lib/util/string.js';
import { templateHasAuth, templateLocale, templateParent, templateTable } from './templates.js';
import type { LocaleConfig } from 'rizom/types/config.js';
import type { RelationFieldsMap } from './relations/definition.js';
import { FormFieldBuilder, type FieldBuilder } from 'rizom/fields/builders/field.js';
import { GroupFieldBuilder } from 'rizom/fields/group/index.js';
import { TreeBuilder } from 'rizom/fields/tree/index.js';
const p = toPascalCase;

type Args = {
	fields: FieldBuilder<Field>[];
	tableName: string;
	rootName: string;
	locales?: LocaleConfig[];
	hasParent?: boolean;
	relationFieldsMap?: RelationFieldsMap;
	relationsDic?: Record<string, string[]>;
	hasAuth?: boolean;
	blocksRegister: string[];
};

type Return = {
	schema: string;
	relationFieldsMap: RelationFieldsMap;
	relationsDic: Record<string, string[]>;
	relationFieldsHasLocale: boolean;
};

function hasLocalizedField(fields: FieldBuilder<Field>[]): boolean {
	// Iterate through each field in the array
	for (const field of fields) {
		// Case 1: If it's a group field, check all fields within the group
		if (isGroupField(field.raw)) {
			if (hasLocalizedField(field.raw.fields)) {
				return true;
			}
		}

		// Case 2: If it's a tabs field, check all fields within each tab
		else if (isTabsField(field.raw)) {
			for (const tab of field.raw.tabs) {
				if (hasLocalizedField(tab.raw.fields)) {
					return true;
				}
			}
		}

		// Case 3: If it's a blocks field, check all fields within each block
		else if (isBlocksField(field.raw)) {
			for (const block of field.raw.blocks) {
				if (hasLocalizedField(block.raw.fields)) {
					return true;
				}
			}
		}

		// Case 4: For regular form fields, check if it's marked as localized
		else if (isFormField(field.raw) && field.raw.localized) {
			return true;
		}
	}

	// If no localized fields were found, return false
	return false;
}

const buildRootTable = ({
	fields: incomingFields,
	tableName,
	rootName,
	hasParent,
	locales,
	relationFieldsMap = {},
	relationsDic = {},
	hasAuth,
	blocksRegister
}: Args): Return => {
	const blocksTables: string[] = [];
	let relationFieldsHasLocale = false;

	const generateFieldsTemplates = (
		fields: FieldBuilder<Field>[],
		withLocalized?: boolean
	): string[] => {
		/** All key/pair, rizom field / drizzle schema string  */
		let templates: string[] = [];

		const checkLocalized = (field: FormFieldBuilder<FormField>) => {
			return (
				(withLocalized && field.raw.localized) ||
				(!withLocalized && !field.raw.localized) ||
				withLocalized === undefined
			);
		};

		for (const field of fields) {
			if (field instanceof GroupFieldBuilder) {
				templates = [...templates, ...generateFieldsTemplates(field.raw.fields, withLocalized)];
			} else if (isTabsField(field.raw)) {
				for (const tab of field.raw.tabs) {
					templates = [...templates, ...generateFieldsTemplates(tab.raw.fields, withLocalized)];
				}
			} else if (isRelationField(field.raw)) {
				if (field.raw.localized) {
					relationFieldsHasLocale = true;
				}
				relationFieldsMap = {
					...relationFieldsMap,
					[field.raw.name]: {
						to: field.raw.relationTo,
						localized: field.raw.localized
					}
				};
			} else if (isBlocksField(field.raw)) {
				for (const block of field.raw.blocks) {
					const blockTableName = `${rootName}Blocks${p(block.raw.name)}`;
					if (!blocksRegister.includes(blockTableName)) {
						// Add the blocks as a relation of the root collection
						relationsDic = {
							...relationsDic,
							[rootName]: [...(relationsDic[rootName] || []), blockTableName]
						};
						// Build the child blocks table
						const {
							schema: blockTable,
							relationsDic: nestedRelationsDic,
							relationFieldsMap: nestedRelationFieldsDic
						} = buildRootTable({
							blocksRegister,
							fields: block.raw.fields,
							tableName: blockTableName,
							hasParent: true,
							relationsDic,
							relationFieldsMap,
							locales,
							rootName
						});
						relationsDic = nestedRelationsDic;
						relationFieldsMap = nestedRelationFieldsDic;
						blocksRegister.push(blockTableName);
						blocksTables.push(blockTable);
					}
				}
			} else if (field instanceof TreeBuilder) {
				const treeTableName = `${rootName}Tree${p(field.name)}`;
				if (!blocksRegister.includes(treeTableName)) {
					// Add the tree table as relation of the root collection
					relationsDic = {
						...relationsDic,
						[rootName]: [...(relationsDic[rootName] || []), treeTableName]
					};
					const {
						schema: treeTable,
						relationsDic: nestedRelationsDic,
						relationFieldsMap: nestedRelationFieldsDic
					} = buildRootTable({
						blocksRegister,
						fields: field.raw.fields,
						tableName: treeTableName,
						hasParent: true,
						relationsDic,
						relationFieldsMap,
						locales,
						rootName
					});
					relationsDic = nestedRelationsDic;
					relationFieldsMap = nestedRelationFieldsDic;
					blocksRegister.push(treeTableName);
					blocksTables.push(treeTable);
				}
			} else if (field instanceof FormFieldBuilder) {
				if (checkLocalized(field)) {
					templates.push(field.toSchema() + ',');
				}
			}
		}
		return templates;
	};

	let table: string;

	if (locales && locales.length && hasLocalizedField(incomingFields)) {
		const tableNameLocales = `${tableName}Locales`;
		const strLocalizedFields = generateFieldsTemplates(incomingFields, true);
		relationsDic[tableName] = [...(relationsDic[tableName] || []), tableNameLocales];
		const strUnlocalizedFields = generateFieldsTemplates(incomingFields, false);
		if (hasParent) {
			strUnlocalizedFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strUnlocalizedFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strUnlocalizedFields.join('\n  '));
		table += templateTable(
			tableNameLocales,
			[...strLocalizedFields, templateLocale(), templateParent(tableName)].join('\n  ')
		);
	} else {
		const strFields = generateFieldsTemplates(incomingFields);
		if (hasParent) {
			strFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strFields.join('\n  '));
	}

	return {
		schema: [table, ...blocksTables].join('\n\n'),
		relationFieldsMap,
		relationFieldsHasLocale,
		relationsDic
	};
};

export default buildRootTable;
