export const getTreeTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Tree`) && !key.endsWith('Locales'));

export const getBlocksTableNames = (slug: string, tables: Record<string, any>): string[] =>
	Object.keys(tables).filter((key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales'));

/**
 * Utility functions for handling path transformations between document paths (dot notation)
 * and database group/tabs schema paths (double underscore notation)
 */

/**
 * Convert a document path using dot notation to a database schema path using double underscores
 * @example
 * toSchemaPath('attributes.hero.title') // returns 'attributes__hero__title'
 */
export const toSchemaPath = (path: string): string => path.replace(/\./g, '__');

/**
 * Convert a database schema path using double underscores to a document path using dot notation
 * @example
 * toDocPath('attributes__hero__title') // returns 'attributes.hero.title'
 */
export const toDocPath = (path: string): string => path.replace(/__/g, '.');

/**
 * Converts an object's keys from database schema format (double underscores) to document format (dot notation).
 * 
 * This function takes an object with keys using database column naming (e.g., 'attributes__title')
 * and transforms them to document path format (e.g., 'attributes.title') while preserving the values.
 * 
 * @example
 * transformKeysToDoc({ 'attributes__title': 'Home' }) // returns { 'attributes.title': 'Home' }
 */
export const transformKeysToDoc = (obj: Record<string, any>): Record<string, any> => {
	const result: Record<string, any> = {};
	for (const [key, value] of Object.entries(obj)) {
		result[toDocPath(key)] = value;
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
 * For example, if the database schema has a column 'attributes__title', this function will:
 * - Look for data.attributes.title in a nested object structure
 * - OR look for data['attributes.title'] in a flat object structure
 * - Then map the found value to result['attributes__title']
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
		const docPath = toDocPath(column);

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
			console.warn(`No default value provided for ${column}, set it with a placeholder`)
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
