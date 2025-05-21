import { and, eq, getTableColumns } from 'drizzle-orm';
import { transformDataToSchema } from '../util/schema.js';

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
