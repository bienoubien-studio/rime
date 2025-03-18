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
 * Transform an object's keys from document paths to schema paths
 */
export const transformKeysToSchema = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSchemaPath(key)] = value;
  }
  return result;
};

/**
 * Transform an object's keys from schema paths to document paths
 */
export const transformKeysToDoc = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toDocPath(key)] = value;
  }
  return result;
};

/**
 * Transform data object based on table columns schema paths
 * Only extracts and transforms the paths that exist in the table schema
 */
export const transformDataToSchema = (data: Record<string, any>, columns: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    
    for (const column of Object.keys(columns)) {
        // Skip special columns
        if (['id', 'parentId', 'locale', 'createdAt', 'updatedAt'].includes(column)) {
            continue;
        }

        // Convert schema path (with __) to doc path (with .)
        const docPath = toDocPath(column);
        
        // Get value from nested path
        const pathParts = docPath.split('.');
        let value = data;
        for (const part of pathParts) {
            value = value?.[part];
            if (value === undefined) break;
        }

        // Only set if value exists
        if (value !== undefined) {
            result[column] = value;
        }
    }
    
    return result;
};
