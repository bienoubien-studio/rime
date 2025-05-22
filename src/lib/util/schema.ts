import { and, eq, getTableColumns } from 'drizzle-orm';
import { omit } from 'rizom/util/object.js';
import type { RawDoc } from 'rizom/types/doc.js';
import { RizomError } from 'rizom/errors/index.js';

export const generatePK = (): string => {
  return crypto.randomUUID();
};

/**
 * Updates a database table with the provided data and timestamp
 */
export async function updateTableRecord(db: any, tables: any, tableName: string, options: {
  recordId: string;
  data: any;
  timestamp: Date;
}) {
  const { recordId, data, timestamp } = options;
  if (Object.keys(data).length) {
    await db
      .update(tables[tableName])
      .set({
        ...data,
        updatedAt: timestamp
      })
      .where(eq(tables[tableName].id, recordId));
  }
}

/**
 * Inserts a new record into a database table
 * @returns The ID of the inserted record
 */
export async function insertTableRecord(db: any, tables: any, tableName: string, data: any): Promise<string> {
  const recordId = data.id || generatePK();
  await db.insert(tables[tableName]).values({
    ...data,
    id: recordId
  });
  return recordId;
}

/**
 * Updates or inserts localized data for a record
 */
export async function upsertLocalizedData(db: any, tables: any, tableLocalesName: string, options: {
  ownerId: string;
  data: any;
  locale: string;
}) {
  const { ownerId, data, locale } = options;
  if (Object.keys(data).length) {
    const tableLocales = tables[tableLocalesName];
    const localizedRow = await db.query[tableLocalesName].findFirst({
      where: and(eq(tableLocales.ownerId, ownerId), eq(tableLocales.locale, locale))
    });

    if (localizedRow) {
      // Update existing localized data
      await db
        .update(tableLocales)
        .set(data)
        .where(
          and(eq(tableLocales.ownerId, ownerId), eq(tableLocales.locale, locale))
        );
    } else {
      // Insert new localized data
      await db.insert(tableLocales).values({
        id: generatePK(),
        ...data,
        ownerId,
        locale
      });
    }
  }
}

/**
 * Prepares data for database operations by transforming it according to table schemas
 */
export function prepareSchemaData(data: any, options: {
  mainTableName: string;
  localesTableName: string;
  locale?: string;
  tables: any;
  fillNotNull?: boolean;
}) {
  const { mainTableName, localesTableName, locale, tables, fillNotNull } = options;
  
  if (locale && localesTableName in tables) {
    // Handle localized fields
    const unlocalizedColumns = getTableColumns(tables[mainTableName]);
    const localizedColumns = getTableColumns(tables[localesTableName]);

    return {
      mainData: transformDataToSchema(data, unlocalizedColumns, { fillNotNull }),
      localizedData: transformDataToSchema(data, localizedColumns, { fillNotNull }),
      isLocalized: true
    };
  } else {
    // Handle non-localized fields
    const columns = getTableColumns(tables[mainTableName]);
    return {
      mainData: transformDataToSchema(data, columns, { fillNotNull }),
      localizedData: {},
      isLocalized: false
    };
  }
}

export function mergeDocumentWithVersion(doc: RawDoc, versionTableName: string ) {
  // Check if we have version data
  if (!doc[versionTableName] || doc[versionTableName].length === 0) {
    throw new RizomError(RizomError.NOT_FOUND, 'area found but without version, should never happen');
  }

  const versionData = doc[versionTableName][0];
  return {
    ...omit([versionTableName], doc),
    ...omit(['id', 'ownerId', 'createdAt', 'updatedAt'], versionData),
    versionId: versionData.id
  }
}

export const getTreeTableNames = (slug: string, tables: Record<string, any>): string[] =>
  Object.keys(tables).filter((key) => key.startsWith(`${slug}Tree`) && !key.endsWith('Locales'));

export const getBlocksTableNames = (slug: string, tables: Record<string, any>): string[] =>
  Object.keys(tables).filter((key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales'));

export const makeVersionsTableName = (tableName:string) => `${tableName}_versions`

/**
 * Utility functions for handling path transformations between document paths (dot notation)
 * and database group/tabs schema paths (double underscore notation)
 */

/**
 * Convert a document path using dot notation to a database schema path using double underscores
 * @example
 * toSchemaPath('attributes.hero.title') // returns 'attributes__hero__title'
 */
export const pathToDatabaseColumn = (path: string): string => path.replace(/\./g, '__');

/**
 * Convert a database schema path using double underscores to a document path using dot notation
 * @example
 * databaseColumnToPath('attributes__hero__title') // returns 'attributes.hero.title'
 */
export const databaseColumnToPath = (path: string): string => path.replace(/__/g, '.');

/**
 * Converts an object's keys from database schema format (double underscores) to document format (dot notation).
 * 
 * This function takes an object with keys using database column naming (e.g., 'attributes__title')
 * and transforms them to document path format (e.g., 'attributes.title') while preserving the values.
 * 
 * @example
 * transformDatabaseColumnsToPaths({ 'attributes__title': 'Home' }) // returns { 'attributes.title': 'Home' }
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
