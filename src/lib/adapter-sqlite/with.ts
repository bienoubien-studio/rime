import { asc, eq, getTableColumns, SQL } from 'drizzle-orm';
import type { Dic } from '$lib/util/types';
import type { ConfigInterface } from '$lib/core/config/index.server';
import { getBlocksTableNames, getTreeTableNames } from '$lib/util/schema';
import { getFieldConfigByPath } from '$lib/util/config';
import { isBlocksFieldRaw, isRelationField, isTreeFieldRaw } from '$lib/util/field';

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
	
	const withParam: Dic = {};
	
	// Track paths for different field types
	const directRelationPaths: string[] = [];
	const blockPaths: string[] = [];
	const treePaths: string[] = [];
	
	for (const path of select) {
		// Convert dot notation to double underscore notation for SQLite queries
		const sqlPath = path.replace(/\./g, '__');
		
		const fieldConfig = getFieldConfigByPath(path, documentConfig.fields);
		
		if (fieldConfig && isRelationField(fieldConfig)) {
			// Handle relation fields
			directRelationPaths.push(path);
			if (!withParam[`${slug}Rels`]) {
				withParam[`${slug}Rels`] = {
					orderBy: [asc(tables[`${slug}Rels`].path), asc(tables[`${slug}Rels`].position)]
				};
			}
		} else if (fieldConfig && isBlocksFieldRaw(fieldConfig)) {
			// Handle blocks fields
			blockPaths.push(path);
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
			treePaths.push(path);
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
	
	// Handle nested relationships
	
	// 1. Include relations table if we have any container paths (blocks or trees)
	if ((directRelationPaths.length > 0 || blockPaths.length > 0 || treePaths.length > 0) && 
		`${slug}Rels` in tables && 
		!withParam[`${slug}Rels`]) {
		
		const relsTable = tables[`${slug}Rels`];
		
		if (blockPaths.length > 0 || treePaths.length > 0) {
			// Create a where condition that matches relations within any of the container paths
			withParam[`${slug}Rels`] = {
				where: (relation: any, { like, or }: any) => {
					const conditions = [];
					
					// Add conditions for block paths
					for (const path of blockPaths) {
						conditions.push(like(relation.path, `${path}__%`));
					}
					
					// Add conditions for tree paths
					for (const path of treePaths) {
						conditions.push(like(relation.path, `${path}__%`));
					}
					
					// Add direct relation paths if any
					for (const path of directRelationPaths) {
						conditions.push(like(relation.path, path));
					}
					
					return or(...conditions);
				},
				orderBy: [asc(relsTable.path), asc(relsTable.position)]
			};
		} else {
			// If we only have direct relation paths, use the standard approach
			withParam[`${slug}Rels`] = {
				orderBy: [asc(relsTable.path), asc(relsTable.position)]
			};
		}
	}
	
	// 2. Include tree tables for blocks that might contain trees
	if (blockPaths.length > 0) {
		const treeTables = getTreeTableNames(slug, tables);
		for (const treeTable of treeTables) {
			if (!withParam[treeTable]) {
				const treeTableObj = tables[treeTable];
				
				withParam[treeTable] = {
					where: (tree: any, { like, or }: any) => {
						const conditions = blockPaths.map(path => {
							return like(tree.path, `${path}__%`);
						});
						return or(...conditions);
					},
					orderBy: [asc(treeTableObj.position)]
				};
				
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
	}
	
	// 3. Include block tables for trees that might contain blocks
	if (treePaths.length > 0) {
		const blocksTables = getBlocksTableNames(slug, tables);
		for (const blocksTable of blocksTables) {
			if (!withParam[blocksTable]) {
				const blocksTableObj = tables[blocksTable];
				
				withParam[blocksTable] = {
					where: (block: any, { like, or }: any) => {
						const conditions = treePaths.map(path => {
							return like(block.path, `${path}__%`);
						});
						return or(...conditions);
					},
					orderBy: [asc(blocksTableObj.position)]
				};
				
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