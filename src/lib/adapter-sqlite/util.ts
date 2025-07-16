import qs from 'qs';
import { and, desc, eq, getTableColumns, Table } from 'drizzle-orm';
import { RizomError } from '$lib/core/errors';
import { isObjectLiteral, omit, pick } from '$lib/util/object';
import { transformDataToSchema } from '$lib/util/schema';
import type { RawDoc } from '$lib/core/types/doc';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { OperationQuery, ParsedOperationQuery } from '$lib/core/types/index.js';
import type { Dic } from '$lib/util/types.js';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

/**
 * Main function to generated primaryKeys
 */
export const generatePK = (): string => {
	return crypto.randomUUID();
};

/**
 * Updates a database table with the provided data and timestamp
 */
export async function updateTableRecord(
	db: any,
	tables: any,
	tableName: string,
	options: {
		recordId: string;
		data: any;
	}
) {
	const { recordId, data } = options;
	if (Object.keys(data).length) {
		await db.update(tables[tableName]).set(data).where(eq(tables[tableName].id, recordId));
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
export async function upsertLocalizedData(
	db: any,
	tables: any,
	tableLocalesName: string,
	options: {
		ownerId: string;
		data: any;
		locale: string;
	}
) {
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
				.where(and(eq(tableLocales.ownerId, ownerId), eq(tableLocales.locale, locale)));
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
 * Extract root table properties : 
 * - hierarchy props (nested) : _parent and _position
 * - directory props (upload) : _path
 * return an object with the data filtered and the rootData.
 */
export function extractRootData(data: any) {
	const rootData: { _parent?: string; _position?: number, _path?:string } = {};
	// extract nested collection props
	if ('_parent' in data) {
		rootData._parent = data._parent;
		delete data._parent;
	}
	if ('_position' in data) {
		rootData._position = data._position;
		delete data._position;
	}
	// extract upload directory props
	if ('_path' in data) {
		rootData._path = data._path;
		delete data._path;
	}
	return { data, rootData };
}


/**
 * Prepares data for database operations by transforming it according to table schemas
 */
export function prepareSchemaData(
	data: any,
	options: {
		mainTableName: string;
		localesTableName: string;
		locale?: string;
		tables: any;
		fillNotNull?: boolean;
	}
) {
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

/**
 * Merges a document with its version data to create a complete document representation
 *
 * In versioned collections/areas, data is split between:
 * - Root document table (containing hierarchy fields like _parent, _position, and metadata like createdAt)
 * - Version table (containing the actual content fields)
 *
 * This function combines these two data sources into a single document object:
 * 1. Validates that version data exists or throw 404
 * 2. Handles field selection if specified
 * 3. Preserves root document fields (id, createdAt, updatedAt, _parent, _position)
 * 4. Adds version fields while avoiding duplicates
 * 5. Includes the versionId in the result
 */
export function mergeRawDocumentWithVersion(doc: RawDoc, versionTableName: string, select?: string[]) {
	// Check if we have version data
	if (!doc[versionTableName] || doc[versionTableName].length === 0) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	const versionData = doc[versionTableName][0];

	if (select && Array.isArray(select) && select.length) {
		const rootProps = ['createdAt', 'updatedAt', '_parent', '_position', 'id'] as const;
		const hasRootSelectColumn = rootProps.some((column) => select.includes(column));

		// Pick "createdAt" and "updatedAt" on doc if they are in select, or only the "id"
		const docFields = hasRootSelectColumn
			? pick([...select.filter((field) => rootProps.includes(field as any)), 'id'], doc)
			: pick(['id'], doc);

		// Filter out root props as they should come from the doc,
		// plus the ownerId wich is equals to doc.id
		const versionFields = omit([...rootProps, 'ownerId'], versionData);

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
	};
}

/**
 * Build the query params to get either the latest updated document
 * or the published one if version.draft is enabled and draft is true
 */
export function buildPublishedOrLatestVersionParams(args: {
	draft?: boolean;
	config: CompiledArea | CompiledCollection;
	table: any;
}) {
	const { config, table, draft } = args;
	const hasStatus = config.versions && config.versions.draft;
	return hasStatus && !draft
		? {
				where: eq(table.status, 'published'),
				limit: 1
			}
		: {
				orderBy: [desc(table.updatedAt)],
				limit: 1
			};
}

/**
 * Convert and validate on incoming query to a complient query
 * for the buildWhereParam wich require an object with a root prop where.
 *
 * @example
 * // returns
 * { where: queryObject }
 */
export function normalizeQuery(incomingQuery: OperationQuery): ParsedOperationQuery {
	let query;
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
		throw new RizomError(RizomError.INVALID_DATA, 'Query must have a root where property');
	}
	return query as ParsedOperationQuery;
}

export function columnsParams({ table, select }: { table: Dic; select?: string[] }) {
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
	return Object.keys(selectColumns).length ? selectColumns : undefined;
}

/**
 * Get the primary key name given a table
 */
export function getPrimaryKey(table: Table) {
	const columnsPrimary = getTableConfig(table).columns.filter(c => c.primary)
	return columnsPrimary.length ? columnsPrimary[0].name : 'id' 
}
