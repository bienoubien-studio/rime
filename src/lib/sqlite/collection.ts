import { desc, eq } from 'drizzle-orm';
import { generatePK, updateTableRecord, insertTableRecord, upsertLocalizedData, prepareSchemaData } from './util.js';
import { buildWithParam } from './with.js';
import { buildWhereParam } from './where.js';
import { buildOrderByParam } from './orderBy.js';
import type { GenericDoc, PrototypeSlug, RawDoc } from '$lib/types/doc.js';
import type { OperationQuery } from '$lib/types/api.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DeepPartial, Dic } from '$lib/types/util.js';
import type { ConfigInterface } from '../config/index.server.js';
import { RizomError } from 'rizom/errors/index.js';

type Args = {
	db: BetterSQLite3Database<any>;
	tables: any;
	configInterface: ConfigInterface;
};

const createAdapterCollectionInterface = ({ db, tables, configInterface }: Args) => {

	//////////////////////////////////////////////
	// Find All documents in a collection
	//////////////////////////////////////////////
	const findAll: FindAll = async ({ slug, sort, limit, offset, locale }) => {
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;

		if (!hasVersions) {
			// Original implementation for non-versioned collections
			const withParam = buildWithParam({ slug, locale, tables, configInterface });
			const orderBy = buildOrderByParam({ slug, locale, tables, configInterface, by: sort });

			// @ts-expect-error todo
			const rawDocs = await db.query[slug].findMany({
				with: withParam,
				limit: limit || undefined,
				offset: offset || undefined,
				orderBy
			});

			return rawDocs;
		} else {
			// Implementation for versioned collections
			const versionsTable = `${slug}Versions`;
			const withParam = buildWithParam({ slug: versionsTable, locale, tables, configInterface });
			const orderBy = buildOrderByParam({ slug, locale, tables, configInterface, by: sort });

			// @ts-expect-error todo
			const rawDocs = await db.query[slug].findMany({
				with: {
					[versionsTable]: {
						with: withParam,
						orderBy: [desc(tables[versionsTable].updatedAt)],
						limit: 1
					}
				},
				limit: limit || undefined,
				offset: offset || undefined,
				orderBy
			});

			// Transform the result to combine root and version data
			return rawDocs.map((doc: RawDoc) => {
				const versionData = doc[versionsTable][0] || {};
				return {
					id: doc.id,
					...versionData,
					// Keep version ID for reference
					versionId: versionData.id
				};
			});
		}
	};

	//////////////////////////////////////////////
	// Find a document by id
	//////////////////////////////////////////////
	const findById: FindById = async ({ slug, id, versionId, locale }) => {
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;

		if (!hasVersions) {
			// Original implementation for non-versioned collections
			const withParam = buildWithParam({ slug, locale, tables, configInterface });
			// @ts-expect-error foo
			const doc = await db.query[slug].findFirst({
				where: eq(tables[slug].id, id),
				with: withParam
			});

			if (!doc) {
				throw new RizomError(RizomError.NOT_FOUND);
			}

			return doc;
		} else {
			// Implementation for versioned collections
			const versionsTable = `${slug}Versions`;
			const withParam = buildWithParam({ slug: versionsTable, locale, tables, configInterface });

			let params
			if (versionId) {
				params = {
					where: eq(tables[slug].id, id),
					with: {
						[versionsTable]: {
							with: withParam,
							where: eq(tables[versionsTable].id, versionId)
						}
					}
				}
			} else {
				params = {
					where: eq(tables[slug].id, id),
					with: {
						[versionsTable]: {
							with: withParam,
							orderBy: [desc(tables[versionsTable].updatedAt)],
							limit: 1
						}
					}
				}
			}
			// @ts-expect-error foo
			const doc = await db.query[slug].findFirst(params);

			if (!doc) {
				throw new RizomError(RizomError.NOT_FOUND);
			}

			// If we found the document but there are no versions, that's also a 404
			if (!doc[versionsTable] || doc[versionsTable].length === 0) {
				throw new RizomError(RizomError.NOT_FOUND, 'document found but without version, should never happend');
			}

			// Transform the result to combine root and version data
			const versionData = doc[versionsTable][0];
			return {
				id: doc.id,
				...versionData,
				// Keep version ID for reference
				versionId: versionData.id
			};
		}
	};

	//////////////////////////////////////////////
	// Delete a document by ID
	//////////////////////////////////////////////
	const deleteById: DeleteById = async ({ slug, id }) => {
		const docs = await db.delete(tables[slug]).where(eq(tables[slug].id, id)).returning();
		if (!docs || !Array.isArray(docs) || !docs.length) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		return docs[0].id;
	};

	//////////////////////////////////////////////
	// Create a new document
	//////////////////////////////////////////////
	const insert: Insert = async ({ slug, data, locale }) => {
		
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;
		const now = new Date();
		
		// Initialize IDs
		let rootId: string | undefined;
		let versionId: string = generatePK();

		// Determine table names based on versioning
		const mainTable = hasVersions ? `${slug}Versions` : slug;
		const localesTable = hasVersions ? `${slug}VersionsLocales` : `${slug}Locales`;

		// Prepare data for insertion
		const { mainData, localizedData, isLocalized } = prepareSchemaData(data, {
			tables,
			mainTableName: mainTable,
			localesTableName: localesTable,
			locale
		});

		// If it's a versioned collection, create the root document first
		if (hasVersions) {
			// Create root document with only id and timestamps
			rootId = await insertTableRecord(db, tables, slug, {
				createdAt: now,
				updatedAt: now
			});
		}

		// Insert main record
		await insertTableRecord(db, tables, mainTable, {
			id: versionId,
			...mainData,
			...(hasVersions ? { ownerId: rootId } : {}),
			createdAt: now,
			updatedAt: now
		});

		// Insert localized data if needed
		if (isLocalized && Object.keys(localizedData).length) {
			await insertTableRecord(db, tables, localesTable, {
				...localizedData,
				ownerId: versionId,
				locale: locale!
			});
		}

		// For versioned collections, return both the root ID and the version ID
		// For non-versioned collections, versionId is the same as id
		return { 
			id: hasVersions && rootId ? rootId : versionId, 
			versionId: versionId 
		};
	};

	//////////////////////////////////////////////
	// Shared helper functions for database operations
	//////////////////////////////////////////////

	// Use shared utility functions from util.ts
	// These functions have been moved to util.ts for reuse across modules

	const update: Update = async ({ slug, id, versionId, data, locale }) => {
		
		const now = new Date();
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;
		
		if (!hasVersions) {
			// Scenario 0: Non-versioned collections
			const tableName = slug;
			const tableLocalesName = `${slug}Locales`;

			const { mainData, localizedData, isLocalized } = prepareSchemaData(data, {
				tables,
				mainTableName: tableName,
				localesTableName: tableLocalesName,
				locale
			});

			// Update main table
			await updateTableRecord(db, tables, tableName, {
				recordId: id,
				data: mainData,
				timestamp: now
			});

			// Update locales table if needed
			if (isLocalized) {
				await upsertLocalizedData(db, tables, tableLocalesName, {
					ownerId: id,
					data: localizedData,
					locale: locale!
				});
			}

			// For non-versioned collections, versionId is the same as id
			return { id, versionId: id };
		} else if (hasVersions && versionId) {
			// Scenario 1: Update a specific version directly

			// First, update the root table's updatedAt
			await updateTableRecord(db, tables, slug, {
				recordId: id,
				data: {},
				timestamp: now
			});
			
			const versionsTable = `${slug}Versions`;
			const versionsLocalesTable = `${versionsTable}Locales`;

			const { mainData, localizedData, isLocalized } = prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});


			// Update version directly
			await updateTableRecord(db, tables, versionsTable, {
				recordId: versionId,
				data: mainData,
				timestamp: now
			});

			// Update localized data if needed
			if (isLocalized) {
				await upsertLocalizedData(db, tables, versionsLocalesTable, {
					ownerId: versionId,
					data: localizedData,
					locale: locale!
				});
			}

			// For direct version updates, return both the document id and the version id
			return { id, versionId };
		} else {
			// Scenario 2: Update root and create a new version
			
			// 1. First, update the root table's updatedAt
			await updateTableRecord(db, tables, slug, {
				recordId: id,
				data: {},
				timestamp: now
			});

			// 2. Create a new version entry
			const versionsTable = `${slug}Versions`;
			const versionsLocalesTable = `${versionsTable}Locales`;
			const createVersionId = generatePK();

			const { mainData, localizedData, isLocalized } = prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});

			// Insert new version
			await insertTableRecord(db, tables, versionsTable, {
				id: createVersionId,
				...mainData,
				ownerId: id,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized && Object.keys(localizedData).length) {
				await insertTableRecord(db, tables, versionsLocalesTable, {
					...localizedData,
					ownerId: createVersionId,
					locale: locale!
				});
			}

			// Return both the document id and the new version id
			return { id, versionId: createVersionId };
		}
	};

	//////////////////////////////////////////////
	// Query documents with a qsQuery
	//////////////////////////////////////////////
	const query: QueryDocuments = async ({ slug, query, sort, limit, offset, locale }) => {
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;

		if (!hasVersions) {
			// Original implementation for non-versioned collections
			const params: Dic = {
				with: buildWithParam({ slug, locale, tables, configInterface }),
				where: buildWhereParam({ query, slug, locale, db }),
				orderBy: sort ? buildOrderByParam({ slug, locale, tables, configInterface, by: sort }) : undefined,
				limit: limit || undefined,
				offset: offset || undefined
			};

			// Remove undefined properties
			Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

			// @ts-expect-error todo
			const result = await db.query[slug].findMany(params);

			return result;
		} else {
			// Implementation for versioned collections
			const versionsTable = `${slug}Versions`;
			const withParam = buildWithParam({ slug: versionsTable, locale, tables, configInterface });
			const whereParam = buildWhereParam({ query, slug: versionsTable, locale, db });
			
			// Build the query parameters for pagination and sorting of the root table
			const params: Dic = {
				limit: limit,
				offset: offset
			};

			// Remove undefined properties
			Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

			// @ts-expect-error todo
			const rawDocs = await db.query[slug].findMany({
				...params,
				with: {
					[versionsTable]: {
						with: withParam,
						where: whereParam,
						orderBy: [desc(tables[versionsTable].updatedAt)],
						limit: 1
					}
				}
			});
			
			// Transform the results to include version data
			const result = rawDocs.map((doc: Record<string, any>) => {
				if (!doc[versionsTable] || !doc[versionsTable].length) {
					return doc;
				}

				const versionData = doc[versionsTable][0];
				delete doc[versionsTable];

				return {
					id: doc.id,
					...versionData,
					// Keep version ID for reference
					versionId: versionData.id
				};
			});

			return result;
		}
	};

	//////////////////////////////////////////////
	// Select
	//////////////////////////////////////////////
	const select: SelectDocuments = async ({ slug, select, query, sort, limit, offset, locale }) => {
		const config = configInterface.getCollection(slug);
		const hasVersions = !!config.versions;

		if (!hasVersions) {
			// Original implementation for non-versioned collections
			const params: Dic = {
				with: buildWithParam({ slug, select, tables, configInterface, locale }) || undefined,
				orderBy: sort ? buildOrderByParam({ slug, locale, tables, configInterface, by: sort }) : undefined,
				limit: limit || undefined,
				offset: offset || undefined
			};

			if (query) {
				params.where = buildWhereParam({ query, slug, locale, db })
			}

			// Remove undefined properties
			Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

			// Get the table for this document type
			const table = tables[slug];

			// Create an object to hold the columns we want to select
			const selectColumns: Dic = {};

			// If select fields are specified, build the select columns object
			if (select && select.length > 0) {
				// Always include the ID column
				selectColumns.id = true;

				// Process each requested field
				for (const path of select) {
					// Convert nested paths (dot notation) to SQL format (double underscore)
					// Example: 'attributes.slug' becomes 'attributes__slug'
					const sqlPath = path.replace(/\./g, '__');

					// If this column exists directly on the table, add it to our select
					if (sqlPath in table) {
						selectColumns[sqlPath] = true;
					}
				}
			}

			if (Object.keys(selectColumns).length > 0) {
				// @ts-expect-error todo
				return await db.query[slug].findMany({
					columns: selectColumns,
					...params
				});
			} else {
				// @ts-expect-error todo
				return await db.query[slug].findMany(params);
			}
		} else {
			// Implementation for versioned collections
			const versionsTable = `${slug}Versions`;
			const withParam = buildWithParam({ slug: versionsTable, select, tables, configInterface, locale }) || undefined;
			const whereParam = query ? buildWhereParam({ query, slug: versionsTable, locale, db }) : undefined;
			
			// Build the query parameters for pagination and sorting of the root table
			const params: Dic = {
				limit: limit,
				offset: offset
			};

			// Remove undefined properties
			Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

			// Get the versions table for column selection
			const versionsTableObj = tables[versionsTable];
			
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
					if (sqlPath in versionsTableObj) {
						selectColumns[sqlPath] = true;
					}
				}
			}

			// @ts-expect-error todo
			const rawDocs = await db.query[slug].findMany({
				...params,
				with: {
					[versionsTable]: {
						with: withParam,
						where: whereParam,
						orderBy: [desc(tables[versionsTable].updatedAt)],
						limit: 1,
						...(Object.keys(selectColumns).length > 0 ? { columns: selectColumns } : {})
					}
				}
			});

			// Transform the results to include version data
			const result = rawDocs.map((doc: Record<string, any>) => {
				if (!doc[versionsTable] || !doc[versionsTable].length) {
					return doc;
				}

				const versionData = doc[versionsTable][0];
				delete doc[versionsTable];

				return {
					id: doc.id,
					...versionData,
					// Keep version ID for reference
					versionId: versionData.id
				};
			});

			return result;
		}
	};

	return {
		findAll,
		findById,
		deleteById,
		insert,
		update,
		select,
		query
	};
};

export default createAdapterCollectionInterface;

export type AdapterCollectionInterface = ReturnType<typeof createAdapterCollectionInterface>;

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type FindAll = (args: {
	slug: PrototypeSlug;
	sort?: string;
	limit?: number;
	offset?: number;
	locale?: string;
}) => Promise<RawDoc[]>;

type QueryDocuments = (args: {
	slug: PrototypeSlug;
	query: OperationQuery;
	sort?: string;
	limit?: number;
	offset?: number;
	locale?: string;
}) => Promise<RawDoc[]>;

type SelectDocuments = (args: {
	slug: PrototypeSlug;
	select: string[];
	query?: OperationQuery;
	sort?: string;
	limit?: number;
	offset?: number;
	locale?: string;
}) => Promise<RawDoc[]>;

type FindById = (args: {
	slug: PrototypeSlug;
	id: string;
	/** Optional parameter to get a specific version */
	versionId?: string;
	locale?: string;
	select?: string[];
}) => Promise<RawDoc>;

type DeleteById = (args: { slug: PrototypeSlug; id: string }) => Promise<string | undefined>;

type Insert = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<{ id: string; versionId: string }>;

type Update = (args: {
	slug: PrototypeSlug;
	id: string;
	/** Optional parameter to specify direct version update */
	versionId?: string;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<{ id: string; versionId: string }>;
