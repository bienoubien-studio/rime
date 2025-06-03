import { and, desc, eq, getTableColumns } from "drizzle-orm";
import qs, { type ParsedQs } from 'qs';
import { RizomError } from "$lib/core/errors";
import type { RawDoc } from "$lib/core/types/doc";
import { isObjectLiteral, omit, pick } from "$lib/util/object";
import { transformDataToSchema } from "$lib/util/schema";
import type { BuiltArea, BuiltCollection } from "../types.js";
import type { OperationQuery, ParsedOperationQuery } from "$lib/core/types/index.js";
import type { Dic } from "$lib/util/types.js";

/**
 * Main function to generated primaryKeys
 */
export const generatePK = (): string => {
  return crypto.randomUUID();
};

/**
 * Updates a database table with the provided data and timestamp
 */
export async function updateTableRecord(db: any, tables: any, tableName: string, options: {
  recordId: string;
  data: any;
}) {
  const { recordId, data } = options;
  if (Object.keys(data).length) {
    await db
      .update(tables[tableName])
      .set(data)
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

export function mergeDocumentWithVersion(doc: RawDoc, versionTableName: string, select?: string[]) {
  // Check if we have version data
  if (!doc[versionTableName] || doc[versionTableName].length === 0) {
    throw new RizomError(RizomError.NOT_FOUND);
  }
  
  const versionData = doc[versionTableName][0];

  if (select && Array.isArray(select) && select.length) {
    const rootProps = ['createdAt', 'updatedAt', 'id'] as const
    const hasRootSelectColumn = rootProps.some(column => select.includes(column))

    // Pick only selected fields from both document and version data
    const docFields = hasRootSelectColumn
      ? pick([...select.filter(field => rootProps.includes(field as any)), 'id'], doc)
      : pick(['id'], doc);

    // Pick selected fields from version data
    // Filter out root props as they should come from the doc
    const versionFields = pick(
      select.filter(field => !rootProps.includes(field as any)),
      versionData
    );

    return {
      ...docFields,
      ...versionFields,
      versionId: versionData.id
    };
  }

  // Default case - return all fields
  return {
    ...omit([versionTableName], doc),
    ...omit(['id', 'ownerId', 'createdAt', 'updatedAt'], versionData),
    versionId: versionData.id
  }
}

/**
 * Build the query params to get either the latest updated document
 * or the published one if version.draft is enabled and draft is true
 */
export function buildPublishedOrLatestVersionParams(args: { draft?: boolean, config: BuiltArea | BuiltCollection, table: any }) {
  const { config, table, draft } = args
  const hasStatus = config.versions && config.versions.draft
  return hasStatus && !draft ? {
    where: eq(table.status, 'published'),
    limit: 1
  } : {
    orderBy: [desc(table.updatedAt)],
    limit: 1
  }
}

export function normalizeQuery(incomingQuery: OperationQuery): ParsedOperationQuery {
  let query
  if (typeof incomingQuery === 'string') {
    try {
      query = qs.parse(incomingQuery);
    } catch (err: any) {
      throw new RizomError(RizomError.INVALID_DATA, 'Unable to parse given string query ' + err.message);
    }
  } else {
    if (!isObjectLiteral(incomingQuery)) {
      throw new RizomError(RizomError.INVALID_DATA, 'Query is not an object');
    }
    query = incomingQuery;
  }
  if (!query.where) {
    throw new RizomError(RizomError.INVALID_DATA, 'Query must have a root where property')
  }
  return query as ParsedOperationQuery
}

export function columnsParams({ table, select }: { table: Dic, select?: string[]  }) {
  // Create an object to hold the columns we want to select
  const selectColumns: Dic = {};
  // If select fields are specified, build the select columns object
  if (select && select.length > 0) {
    // Always include the ID column for the version
    selectColumns.id = true;
    // Process each requested field
    for (const path of select) {
      // Convert nested paths (dot notation) to SQL format (double underscore)
      // Example: 'attributes.slug' becomes 'attributes__slug'
      const sqlPath = path.replace(/\./g, '__');
      // If this column exists on the versions table, add it to our select
      if (sqlPath in table) {
        selectColumns[sqlPath] = true;
      }
    }
  }
  return Object.keys(selectColumns).length ? selectColumns : undefined
}