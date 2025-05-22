import type { PrototypeSlug } from '$lib/types/doc';
import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import type { ConfigInterface } from 'rizom/config/index.server';
import { logger } from 'rizom/util/logger/index.server';
import { databaseColumnToPath, makeVersionsTableName, pathToDatabaseColumn } from '../util/schema.js';

type Args = {
	slug: PrototypeSlug;
	locale?: string;
	configInterface: ConfigInterface;
	by?: string;
	tables: any;
};

export const buildOrderByParam = ({ slug, locale, tables, configInterface, by }: Args) => {
	// Get collection config to check if it has versions
	const config = configInterface.getBySlug(slug);
	const hasVersions = !!config.versions;

	// Get the root table
	const rootTable = tables[slug];
	by = by ? pathToDatabaseColumn(by) : by
	
	// If no sort parameter or sorting by system fields (createdAt/updatedAt),
	// default to descending by createdAt on the main table
	if (!by || by === 'createdAt' || by === 'updatedAt' || by === '-createdAt' || by === '-updatedAt') {
		const orderFunc = !by || by.charAt(0) !== '-' ? desc : asc;
		const columnStr = by ? by.replace(/^-/, '') : 'createdAt';
		return [orderFunc(rootTable[columnStr])];
	}
	
	// Parse the sort parameter for other fields
	const orderFunc = by.charAt(0) === '-' ? desc : asc;
	const columnStr = by.replace(/^-/, '');
	
	// For non-versioned collections
	if (!hasVersions) {
		const rootTableColumns = Object.keys(getTableColumns(rootTable));
		
		console.log(columnStr)
		// Check if the column exists in the root table
		if (rootTableColumns.includes(columnStr)) {
			return [orderFunc(rootTable[columnStr])];
		}
		
		// Check if it's a localized field in a non-versioned collection
		if (locale) {
			const localeTableName = `${slug}Locales` as keyof typeof tables;
			if (localeTableName in tables) {
				const localeTable = tables[localeTableName];
				const localizedColumns = getTableColumns(localeTable);
				
				if (Object.keys(localizedColumns).includes(columnStr)) {
					const { name: sqlLocaleTableName } = getTableConfig(localeTable);
					const { name: sqlTableName } = getTableConfig(rootTable);
					return [
						orderFunc(
							sql.raw(
								`(SELECT DISTINCT ${sqlLocaleTableName}."${localizedColumns[columnStr].name}" FROM ${sqlLocaleTableName} WHERE ${sqlLocaleTableName}."owner_id" = ${sqlTableName}."id" AND ${sqlLocaleTableName}."locale" = '${locale}')`
							)
						)
					];
				}
			}
		}
	} else {
		const versionTableName = makeVersionsTableName(slug)
		const versionsTable = tables[ versionTableName ];
		const versionsTableColumns = Object.keys(getTableColumns(versionsTable));
		
		// Check if the column exists in the versions table and is not a system field
		if (versionsTableColumns.includes(columnStr) && columnStr !== 'createdAt' && columnStr !== 'updatedAt') {
			const { name: sqlVersionsTableName } = getTableConfig(versionsTable);
			const { name: sqlRootTableName } = getTableConfig(rootTable);
			
			// Use a subquery to get the value from the latest version for ordering
			return [
				orderFunc(
					sql.raw(
						`(SELECT DISTINCT ${sqlVersionsTableName}."${columnStr}" FROM ${sqlVersionsTableName} WHERE ${sqlVersionsTableName}."owner_id" = ${sqlRootTableName}."id" ORDER BY ${sqlVersionsTableName}."updated_at" DESC LIMIT 1)`
					)
				)
			];
		}
		
		// Check if it's a localized field in a versioned collection
		if (locale) {
			const versionsLocaleTableName = `${versionTableName}Locales` as keyof typeof tables;
			if (versionsLocaleTableName in tables) {
				const localeTable = tables[versionsLocaleTableName];
				const localizedColumns = getTableColumns(localeTable);
				
				if (Object.keys(localizedColumns).includes(columnStr)) {
					const { name: sqlLocaleTableName } = getTableConfig(localeTable);
					const { name: sqlVersionsTableName } = getTableConfig(versionsTable);
					const { name: sqlRootTableName } = getTableConfig(rootTable);
					
					// Nested subquery: first get the latest version, then get the localized value
					return [
						orderFunc(
							sql.raw(
								`(SELECT ${sqlLocaleTableName}."${localizedColumns[columnStr].name}" 
								  FROM ${sqlLocaleTableName} 
								  WHERE ${sqlLocaleTableName}."owner_id" IN 
								    (SELECT ${sqlVersionsTableName}."id" 
									 FROM ${sqlVersionsTableName} 
									 WHERE ${sqlVersionsTableName}."owner_id" = ${sqlRootTableName}."id" 
									 ORDER BY ${sqlVersionsTableName}."updated_at" DESC LIMIT 1)
								  AND ${sqlLocaleTableName}."locale" = '${locale}'
								  LIMIT 1)`
							)
						)
					];
				}
			}
		}
	}
	
	logger.warn(`"${by}" is not a property of ${slug}`);
	
	// Fallback to ordering by createdAt on the root table
	return [desc(rootTable.createdAt)];
};
