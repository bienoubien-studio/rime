import type { AnyField, AnyFormField } from 'rizom/types/fields.js';
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
} from '../../utils/field.js';
import { toPascalCase } from '$lib/utils/string.js';
import {
	templateDateField,
	templateHasAuth,
	templateLinkField,
	templateLocale,
	templateNumberField,
	templateParent,
	templateRadioField,
	templateRichTextField,
	templateSelectField,
	templateTable,
	templateTextField,
	templateToggleField
} from './templates.js';
import type { LocaleConfig } from 'rizom/types/config.js';
// import logger from 'rizom/logger/index.js';
const p = toPascalCase;

type BuildTableArgs = {
	fields: AnyField[];
	tableName: string;
	rootName: string;
	locales?: LocaleConfig[];
	hasParent?: boolean;
	relationFieldsDic?: Record<string, any>;
	relationsDic?: Record<string, string[]>;
	hasAuth?: boolean;
};

type BuildTableReturn = {
	content: string;
	relationFieldsDic: Record<string, any>;
	relationsDic: Record<string, string[]>;
	relationFieldsHasLocale: boolean;
};

const buildTable = ({
	fields: incomingFields,
	tableName,
	rootName,
	hasParent,
	locales,
	relationFieldsDic = {},
	relationsDic = {},
	hasAuth
}: BuildTableArgs): BuildTableReturn => {
	const registeredBlocks: string[] = [];
	const blocksTables: string[] = [];
	let relationFieldsHasLocale = false;

	const tableNeedLocales = (fields: AnyField[]) => {
		let needLocales = false;
		for (const field of fields) {
			if (isGroupField(field)) {
				needLocales = tableNeedLocales(field.fields);
			} else if (isTabsField(field)) {
				for (const tab of field.tabs) {
					needLocales = tableNeedLocales(tab.fields);
				}
			} else if (isBlocksField(field)) {
				for (const block of field.blocks) {
					needLocales = tableNeedLocales(block.fields);
				}
			} else {
				needLocales = isFormField(field) && !!field.localized;
			}
			if (needLocales) return true;
		}
		return false;
	};

	const traverseFields = (fields: AnyField[], withLocalized?: boolean): string[] => {
		// Change here
		let returningFields: string[] = [];

		const checkLocalized = (config: AnyFormField) => {
			return (
				(withLocalized && config.localized) ||
				(!withLocalized && !config.localized) ||
				withLocalized === undefined
			);
		};

		for (const field of fields) {
			if (isTextField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateTextField(field));
				}
			} else if (isEmailField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateTextField(field));
				}
			} else if (isSlugField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateTextField(field));
				}
			} else if (isRadioField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateRadioField(field));
				}
			} else if (isSelectField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateSelectField(field));
				}
			} else if (isComboBoxField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateTextField(field));
				}
			} else if (isToggleField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateToggleField(field));
				}
			} else if (isDateField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateDateField(field));
				}
			} else if (isRichTextField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateRichTextField(field));
				}
			} else if (isLinkField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateLinkField(field));
				}
			} else if (isNumberField(field)) {
				if (checkLocalized(field)) {
					returningFields.push(templateNumberField(field));
				}
			} else if (isGroupField(field)) {
				returningFields = [...returningFields, ...traverseFields(field.fields, withLocalized)];
			} else if (isTabsField(field)) {
				for (const tab of field.tabs) {
					returningFields = [...returningFields, ...traverseFields(tab.fields, withLocalized)];
				}
			} else if (isRelationField(field)) {
				if (field.localized) {
					relationFieldsHasLocale = true;
				}
				relationFieldsDic = {
					...relationFieldsDic,
					[field.name]: {
						to: field.relationTo,
						localized: field.localized
					}
				};
			} else if (isBlocksField(field)) {
				// console.log(field);
				for (const block of field.blocks) {
					const blockTableName = `${rootName}Blocks${p(block.name)}`;
					if (!registeredBlocks.includes(blockTableName)) {
						relationsDic = {
							...relationsDic,
							[rootName]: [...(relationsDic[rootName] || []), blockTableName]
						};
						const {
							content: blockTable,
							relationsDic: nestedRelationsDic,
							relationFieldsDic: nestedRelationFieldsDic
						} = buildTable({
							fields: block.fields,
							tableName: blockTableName,
							hasParent: true,
							relationsDic,
							relationFieldsDic,
							locales,
							rootName
						});
						relationsDic = nestedRelationsDic;
						relationFieldsDic = nestedRelationFieldsDic;
						registeredBlocks.push(blockTableName);
						blocksTables.push(blockTable);
					}
				}
			}
		}
		return returningFields;
	};

	let table: string;

	if (locales && locales.length && tableNeedLocales(incomingFields)) {
		const tableNameLocales = `${tableName}Locales`;
		const strLocalizedFields = traverseFields(incomingFields, true);
		relationsDic[tableName] = [...(relationsDic[tableName] || []), tableNameLocales];
		const strUnlocalizedFields = traverseFields(incomingFields, false);
		if (hasParent) {
			strUnlocalizedFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strUnlocalizedFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strUnlocalizedFields.join('\n'));
		table += templateTable(
			tableNameLocales,
			[...strLocalizedFields, templateLocale(), templateParent(tableName)].join('\n')
		);
	} else {
		const strFields = traverseFields(incomingFields);
		if (hasParent) {
			strFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strFields.join('\n'));
	}

	return {
		content: [table, ...blocksTables].join('\n\n'),
		relationFieldsDic,
		relationFieldsHasLocale,
		relationsDic
	};
};

export default buildTable;
