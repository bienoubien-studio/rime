import type { CollectionSlug } from '../types.js';

/**
 * Gets all tree table names for a specific collection in the database schema.
 * Tree tables store hierarchical document relationships.
 *
 * @param slug - The collection slug to find tree tables for
 * @param tables - The database schema tables object
 * @returns An array of table names that store tree data for the collection
 *
 * @example
 * // Returns ['pagesTree', 'pagesTreeRelations']
 * getTreeTableNames('pages', dbSchema.tables);
 */
export const getTreeTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Tree`) && !key.endsWith('Locales'));

/**
 * Gets all blocks table names for a specific collection in the database schema.
 * Blocks tables store flexible content blocks data.
 *
 * @param slug - The collection slug to find blocks tables for
 * @param tables - The database schema tables object
 * @returns An array of table names that store blocks data for the collection
 *
 * @example
 * // Returns ['pagesBlocks', 'pagesBlocksContent']
 * getBlocksTableNames('pages', dbSchema.tables);
 */
export const getBlocksTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales'));

/**
 * Creates a upload_directories table name for a given table name.
 * Used for uploads path in the database. 
 * Prevent a version table name from being used, force the use of the main one.
 *
 * @example
 * // Returns botth 'pages_directories'
 * makeUploadDirectoriesSlug('pages');
 * makeUploadDirectoriesSlug('pages_versions');
 */
export const makeUploadDirectoriesSlug = (slug: string) => `${slug.replace('_versions', '')}_directories` as CollectionSlug;

/**
 * Check if a slug is a _directories collection slug
 * 
 * @example
 * // Returns true
 * isDirectorySlug('medias_directories');
 */
export const isDirectorySlug = (slug: string) => slug.endsWith('_directories');

/**
 * Creates a versions table name for a given table.
 * Used for document versioning in the database.
 *
 * @example
 * // Returns 'pages_versions'
 * makeVersionsSlug('pages');
 */
export const makeVersionsSlug = (tableName: string) => `${tableName}_versions` as CollectionSlug;

/**
 * Check if a slug is a verioned collection slug
 *  * @example
 * // Returns true
 * isVersionsSlug('pages_versions');
 *
 */
export const isVersionsSlug = (slug: string) => slug.endsWith('_versions');

/**
 * Utility functions for handling path transformations between document paths (dot notation)
 * and database group/tabs schema paths (double underscore notation)
 */

/**
 * Convert a document path using dot notation to a database schema path using double underscores.
 * This transformation is needed because SQL databases don't support dots in column names.
 *
 * @param path - The document path with dot notation
 * @returns The database column path with double underscore notation
 *
 * @example
 * // Returns 'attributes__hero__title'
 * pathToDatabaseColumn('attributes.hero.title');
 */
export const pathToDatabaseColumn = (path: string): string => path.replace(/\./g, '__');

/**
 * Convert a database schema path using double underscores to a document path using dot notation.
 * This transforms database column names back to document property paths.
 *
 * @param path - The database column path with double underscore notation
 * @returns The document path with dot notation
 *
 * @example
 * // Returns 'attributes.hero.title'
 * databaseColumnToPath('attributes__hero__title');
 */
export const databaseColumnToPath = (path: string): string => path.replace(/__/g, '.');

/**
 * Converts an object's keys from database schema format (double underscores) to document format (dot notation).
 *
 * This function takes an object with keys using database column naming (e.g., 'attributes__title')
 * and transforms them to document path format (e.g., 'attributes.title') while preserving the values.
 *
 * @param obj - The object with database column keys
 * @returns A new object with keys converted to document paths
 *
 * @example
 * // Returns { 'attributes.title': 'Home' }
 * transformDatabaseColumnsToPaths({ 'attributes__title': 'Home' });
 */
export const transformDatabaseColumnsToPaths = (obj: Record<string, any>): Record<string, any> => {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		result[databaseColumnToPath(key)] = value;
	}
	return result;
};

/**
 * Extracts values from a data object and maps them to database column names using schema paths.
 *
 * This function converts document data (which may use nested objects with dot notation paths)
 * into a flat object with keys that match the database schema (using double underscore notation).
 * It only includes fields that exist in the provided columns schema.
 *
 * @param data - The document data object (may be nested)
 * @param columns - The database schema columns definition
 * @param params - Optional parameters for transformation
 * @param params.fillNotNull - If true, adds default values for NOT NULL columns
 * @returns A flat object with database column names and values
 *
 * @example
 * // Returns { 'attributes__title': 'Home' }
 * transformDataToSchema(
 *   { attributes: { title: 'Home' } },
 *   { 'attributes__title': { dataType: 'string', notNull: true } }
 * );
 *
 * // With fillNotNull, provides defaults for missing NOT NULL columns
 * transformDataToSchema(
 *   { attributes: {} },
 *   { 'attributes__title': { dataType: 'string', notNull: true } },
 *   { fillNotNull: true }
 * ); // Returns { 'attributes__title': '' }
 */
export const transformDataToSchema = (
	data: Record<string, any>,
	columns: Record<string, any>,
	params: { fillNotNull?: boolean } = { fillNotNull: false }
): Record<string, any> => {
	const result: Record<string, any> = {};

	for (const column of Object.keys(columns)) {
		const columnConfig = columns[column];
		// Convert schema path (with __) to doc path (with .)
		const docPath = databaseColumnToPath(column);

		// Get value from nested path
		const pathParts = docPath.split('.');
		let value = data;
		for (const part of pathParts) {
			value = value?.[part];
			if (value === undefined) break;
		}

		// Case 1: Value exists and is not null - always use it
		if (value !== undefined && value !== null) {
			result[column] = value;
			continue;
		}

		// Case 2: Value is null - use it unless we need to fill it
		if (value === null && !params.fillNotNull) {
			result[column] = null;
			continue;
		}

		// Case 3: Add placeholders for missing or null values in not-null columns
		if (params.fillNotNull && columnConfig.notNull) {
			console.warn(`No default value provided for ${column}, setting it with a placeholder`);
			// Add default values for not-null columns without defaults
			switch (columnConfig.dataType) {
				case 'string':
					result[column] = '';
					break;
				case 'number':
					result[column] = 0;
					break;
				case 'boolean':
					result[column] = false;
					break;
				case 'json':
					result[column] = {};
					break;
				case 'date':
					result[column] = new Date();
					break;
			}
		}
	}

	return result;
};
