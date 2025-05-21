import type { PrototypeSlug } from '$lib/types/doc';
import { asc, desc, getTableColumns, sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import type { ConfigInterface } from 'rizom/config/index.server';
import { logger } from 'rizom/util/logger/index.server';

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
	
	// Determine the actual table to query based on versions
	const actualTableName = hasVersions ? `${slug}Versions` : slug;
	const actualTable = tables[actualTableName];
	
	// If no sort parameter, default to descending by createdAt
	if (!by) return [desc(actualTable.createdAt)];
	
	// Parse the sort parameter
	const orderFunc = by.charAt(0) === '-' ? desc : asc;
	const columnStr = by.replace(/^-/, '');
	const actualTableColumns = Object.keys(getTableColumns(actualTable));

	// If we're querying directly on the versions table or a non-versioned table
	// and the column exists in that table, we can order directly
	if (!hasVersions && actualTableColumns.includes(columnStr)) {
		return [orderFunc(actualTable[columnStr])];
	}
	
	// For versioned collections when querying the root table
	if (hasVersions) {
		// If the column exists in the versions table
		if (actualTableColumns.includes(columnStr)) {
			const { name: sqlVersionsTableName } = getTableConfig(actualTable);
			const { name: sqlRootTableName } = getTableConfig(tables[slug]);
			
			// Use a subquery to get the value from the versions table
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
			const localeTableName = `${actualTableName}Locales` as keyof typeof tables;
			if (localeTableName in tables) {
				const localeTable = tables[localeTableName];
				const localizedColumns = getTableColumns(localeTable);
				
				if (Object.keys(localizedColumns).includes(columnStr)) {
					const { name: sqlLocaleTableName } = getTableConfig(localeTable);
					const { name: sqlVersionsTableName } = getTableConfig(actualTable);
					const { name: sqlRootTableName } = getTableConfig(tables[slug]);
					
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
	} else if (locale) {
		// Handle localized fields for non-versioned collections
		const localeTableName = `${slug}Locales` as keyof typeof tables;
		if (localeTableName in tables) {
			const localeTable = tables[localeTableName];
			const localizedColumns = getTableColumns(localeTable);
			
			if (Object.keys(localizedColumns).includes(columnStr)) {
				const { name: sqlLocaleTableName } = getTableConfig(localeTable);
				const { name: sqlTableName } = getTableConfig(actualTable);
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
	
	logger.warn(`"${by}" is not a property of ${slug}`);

	// Fallback to ordering by createdAt
	return [desc(actualTable.createdAt)];
};
