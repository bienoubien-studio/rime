import { asc, eq, getTableColumns, SQL } from 'drizzle-orm';
import type { Dic } from '$lib/types/util';
import type { ConfigInterface } from 'rizom/config/index.server';
import { getBlocksTableNames, getTreeTableNames } from 'rizom/util/schema';
import { RizomError } from 'rizom/errors';
import { getFieldConfigByPath } from 'rizom/util/config';
import { isBlocksFieldRaw, isRelationField, isTreeFieldRaw } from 'rizom/util/field';

type BuildWithParamArgs = {
	slug: string;
	select?: string[];
	configInterface: ConfigInterface;
	tables: any;
	locale?: string;
};

export const buildWithParam = ({
	slug,
	select = [],
	locale,
	tables,
	configInterface
}: BuildWithParamArgs) => {
	if (!select.length) {
		return buildFullWithParam({
			slug,
			locale,
			tables
		});
	}

	// Get document configuration
	const documentConfig = configInterface.getBySlug(slug);
	if (!documentConfig) {
		throw new RizomError(RizomError.OPERATION_ERROR, 'Config not found for ' + slug);
	}

	const withParam: Dic = {};
	
	for (const path of select) {
		// Convert dot notation to double underscore notation for SQLite queries
		const sqlPath = path.replace(/\./g, '__');
		
		const fieldConfig = getFieldConfigByPath(path, documentConfig.fields);
		if (fieldConfig && isRelationField(fieldConfig)) {
			// Handle relation fields
			if (!withParam[`${slug}Rels`]) {
				withParam[`${slug}Rels`] = {
					orderBy: [asc(tables[`${slug}Rels`].path), asc(tables[`${slug}Rels`].position)]
				};
			}
		} else if (fieldConfig && isBlocksFieldRaw(fieldConfig)) {
			// Handle blocks fields
			const blocksTables = getBlocksTableNames(slug, tables);
			for (const blocksTable of blocksTables) {
				if (!withParam[blocksTable]) {
					const blocksTableObj = tables[blocksTable];
					let params: Dic = { orderBy: [asc(blocksTableObj.position)] };
					const columns = getTableColumns(blocksTableObj);
					const hasLocale = Object.keys(columns).includes('locale');
					
					if (locale && hasLocale) {
						params = { ...params, where: eq(blocksTableObj.locale, locale) };
					}
					
					withParam[blocksTable] = params;
					
					// Handle localized blocks
					if (locale && `${blocksTable}Locales` in tables) {
						withParam[blocksTable] = {
							...withParam[blocksTable],
							with: {
								[`${blocksTable}Locales`]: {
									where: eq(tables[`${blocksTable}Locales`].locale, locale)
								}
							}
						};
					}
				}
			}
		} else if (fieldConfig && isTreeFieldRaw(fieldConfig)) {
			// Handle tree fields
			const treeTables = getTreeTableNames(slug, tables);
			for (const treeTable of treeTables) {
				if (!withParam[treeTable]) {
					const treeTableObj = tables[treeTable];
					let params: Dic = { orderBy: [asc(treeTableObj.position)] };
					const columns = getTableColumns(treeTableObj);
					const hasLocale = Object.keys(columns).includes('locale');
					
					if (locale && hasLocale) {
						params = { ...params, where: eq(treeTableObj.locale, locale) };
					}
					
					withParam[treeTable] = params;
					
					// Handle localized trees
					if (locale && `${treeTable}Locales` in tables) {
						withParam[treeTable] = {
							...withParam[treeTable],
							with: {
								[`${treeTable}Locales`]: {
									where: eq(tables[`${treeTable}Locales`].locale, locale)
								}
							}
						};
					}
				}
			}
		} else if (fieldConfig) {
			// Handle regular fields
			if (fieldConfig.localized && locale) {
				const localesTableName = `${slug}Locales`;
				if (localesTableName in tables) {
					const tableLocales = tables[localesTableName];
					if( withParam[localesTableName] ){
						withParam[localesTableName].columns = {
							...withParam[localesTableName].columns,
							[sqlPath]: true
						}
					}else{
						withParam[localesTableName] = { 
							where: eq(tableLocales.locale, locale),
							columns: { [sqlPath]: true } 
						};
					}
				}
			}
		}
	}

	// If withParam is empty
	if (Object.keys(withParam).length === 0) {
		return false
	}

	return withParam;
};

const buildFullWithParam = ({
	slug,
	locale,
	tables
}: {
	slug: string;
	locale?: string;
	tables: Dic;
}): Dic => {
	const blocksTables = getBlocksTableNames(slug, tables);
	const treeTables = getTreeTableNames(slug, tables);

	const withParam: Dic = Object.fromEntries(
		[...blocksTables, ...treeTables].map((key) => {
			const blockOrTreeTable = tables[key];
			type Params = { orderBy: SQL[]; where?: SQL };
			let params: Params = { orderBy: [asc(blockOrTreeTable.position)] };
			const columns = getTableColumns(blockOrTreeTable);
			const hasLocale = Object.keys(columns).includes('locale');
			if (locale && hasLocale) {
				params = { ...params, where: eq(blockOrTreeTable.locale, locale) };
			}
			return [key, params];
		})
	);

	if (locale) {
		const localesTableName = `${slug}Locales`;
		if (localesTableName in tables) {
			const tableLocales = tables[localesTableName];
			withParam[localesTableName] = { where: eq(tableLocales.locale, locale) };
		}
		for (const blocksTable of blocksTables) {
			if (`${blocksTable}Locales` in tables) {
				withParam[blocksTable] = {
					...withParam[blocksTable],
					with: {
						[`${blocksTable}Locales`]: {
							where: eq(tables[`${blocksTable}Locales`].locale, locale)
						}
					}
				};
			}
		}
		for (const treeTable of treeTables) {
			if (`${treeTable}Locales` in tables) {
				withParam[treeTable] = {
					...withParam[treeTable],
					with: {
						[`${treeTable}Locales`]: {
							where: eq(tables[`${treeTable}Locales`].locale, locale)
						}
					}
				};
			}
		}
	}

	if (`${slug}Rels` in tables) {
		const tableNameRelationFields = `${slug}Rels`;
		const tableRelationFields = tables[tableNameRelationFields];
		withParam[tableNameRelationFields] = {
			orderBy: [asc(tableRelationFields.path), asc(tableRelationFields.position)]
		};
	}

	return withParam;
};
