import { desc, eq } from 'drizzle-orm';
import { buildWithParam } from './with.js';
import { buildWhereParam } from './where.js';
import { buildOrderByParam } from './orderBy.js';
import type { GenericDoc, CollectionSlug, RawDoc } from '$lib/core/types/doc.js';
import type { OperationQuery } from '$lib/core/types/index.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DeepPartial, Dic } from '$lib/util/types.js';
import type { ConfigInterface } from '../core/config/index.server.js';
import { RizomError } from '../core/errors/index.js';
import * as adapterUtil from './util.js';
import * as schemaUtil from '$lib/util/schema.js';
import { VERSIONS_OPERATIONS, VersionOperations } from '$lib/core/operations/shared/versions.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';

type Args = {
	db: BetterSQLite3Database<any>;
	tables: any;
	configInterface: ConfigInterface;
};

/**
 * Creates a collection interface for SQLite adapter operations with CRUD functionality.
 * Handles both versioned and non-versioned collections with support for localization.
 *
 * @example
 * const collectionInterface = createAdapterCollectionInterface({
 *   db: sqliteDb,
 *   tables: schema,
 *   configInterface: config
 * });
 *
 * // Use the interface to perform operations
 * await collectionInterface.findById({ slug: 'posts', id: '123' });
 */
const createAdapterCollectionInterface = ({ db, tables, configInterface }: Args) => {
	/**
	 * Retrieves a document by its ID from a collection. For versioned collections,
	 * returns either a specific version (if versionId is provided) or the latest/published version.
	 *
	 * @example
	 * // Get a document by ID
	 * const doc = await findById({ slug: 'posts', id: '123' });
	 *
	 * // Get a specific version of a document
	 * const docVersion = await findById({
	 *   slug: 'posts',
	 *   id: '123',
	 *   versionId: 'v456',
	 *   locale: 'en'
	 * });
	 *
	 * @returns The found document with all its fields and relations
	 * @throws RizomError when document is not found
	 */
	const findById: FindById = async ({ slug, id, versionId, locale, draft }) => {
		const config = configInterface.getCollection(slug);
		const isVersioned = !!config.versions;

		if (!isVersioned) {
			// Original implementation for non-versioned collections
			const withParam = buildWithParam({ slug, locale, tables, configInterface });
			//@ts-ignore
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
			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const withParam = buildWithParam({ slug: versionsTable, locale, tables, configInterface });

			let params;
			if (versionId) {
				params = {
					where: eq(tables[slug].id, id),
					with: {
						[versionsTable]: {
							with: withParam,
							where: eq(tables[versionsTable].id, versionId)
						}
					}
				};
			} else {
				params = {
					where: eq(tables[slug].id, id),
					with: {
						[versionsTable]: {
							with: withParam,
							...adapterUtil.buildPublishedOrLatestVersionParams({
								draft,
								config,
								table: tables[versionsTable]
							})
						}
					}
				};
			}
			//@ts-ignore
			const doc = await db.query[slug].findFirst(params);

			if (!doc) {
				throw new RizomError(RizomError.NOT_FOUND);
			}

			// If we found the document but there are no versions, that's also a 404
			if (!doc[versionsTable] || doc[versionsTable].length === 0) {
				throw new RizomError(RizomError.NOT_FOUND);
			}

			return adapterUtil.mergeRawDocumentWithVersion(doc, versionsTable);
		}
	};

	/**
	 * Deletes a document by its ID from a collection. For versioned collections,
	 * removes the root document and all its versions.
	 *
	 * @example
	 * // Delete a document
	 * const deletedId = await deleteById({ slug: 'posts', id: '123' });
	 *
	 * @returns The ID of the deleted document
	 * @throws RizomError when document is not found
	 */
	const deleteById: DeleteById = async ({ slug, id }) => {
		const docs = await db.delete(tables[slug]).where(eq(tables[slug].id, id)).returning();
		if (!docs || !Array.isArray(docs) || !docs.length) {
			throw new RizomError(RizomError.NOT_FOUND);
		}
		return docs[0].id;
	};

	/**
	 * Creates a new document in a collection. For versioned collections, creates both
	 * the root document and its first version. For non-versioned collections, creates
	 * a single document with the provided data.
	 *
	 * @example
	 * // Create a new document
	 * const { id, versionId } = await insert({
	 *   slug: 'posts',
	 *   data: { title: 'Hello World', content: 'This is my first post' },
	 *   locale: 'en'
	 * });
	 *
	 * // Create a draft document in a versioned collection
	 * const { id, versionId } = await insert({
	 *   slug: 'posts',
	 *   data: { title: 'Draft Post' },
	 *   draft: true
	 * });
	 *
	 * @returns Object containing the IDs of the created document and version
	 */
	const insert: Insert = async ({ slug, data, locale }) => {
		const config = configInterface.getCollection(slug);
		const isVersioned = !!config.versions;
		const now = new Date();

		if (isVersioned) {
			// Create root document first
			const docId = await adapterUtil.insertTableRecord(db, tables, slug, {
				createdAt: now,
				updatedAt: now
			});

			// Generate version ID
			const versionId = adapterUtil.generatePK();
			const versionsTableName = schemaUtil.makeVersionsSlug(slug);

			// Prepare data for versions table
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: versionsTableName,
				localesTableName: `${versionsTableName}Locales`,
				locale
			});

			// Insert version record
			await adapterUtil.insertTableRecord(db, tables, versionsTableName, {
				id: versionId,
				ownerId: docId,
				...mainData,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized && Object.keys(localizedData).length) {
				await adapterUtil.insertTableRecord(db, tables, `${versionsTableName}Locales`, {
					...localizedData,
					ownerId: versionId,
					locale: locale!
				});
			}

			// Return both IDs for versioned collections
			return {
				id: docId,
				versionId
			};
		} else {
			// Generate document ID
			const docId = adapterUtil.generatePK();

			// Prepare data for main table
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: slug,
				localesTableName: `${slug}Locales`,
				locale
			});

			// Insert main record
			await adapterUtil.insertTableRecord(db, tables, slug, {
				id: docId,
				...mainData,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized && Object.keys(localizedData).length) {
				await adapterUtil.insertTableRecord(db, tables, `${slug}Locales`, {
					...localizedData,
					ownerId: docId,
					locale: locale!
				});
			}

			// For non-versioned collections, id and versionId are the same
			return {
				id: docId,
				versionId: docId
			};
		}
	};

	/**
	 * Updates a document in a collection using different versioning strategies.
	 * Supports multiple update patterns:
	 * - Simple update for non-versioned collections
	 * - Direct version update for versioned collections
	 * - Creating new versions from existing ones
	 * - Publishing draft versions
	 *
	 * @example
	 * // Update a non-versioned document
	 * const { id, versionId } = await update({
	 *   slug: 'posts',
	 *   id: '123',
	 *   data: { title: 'Updated Title' },
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE
	 * });
	 *
	 * // Update a specific version
	 * const { id, versionId } = await update({
	 *   slug: 'posts',
	 *   id: '123',
	 *   versionId: 'v456',
	 *   data: { title: 'Updated Version' },
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE_VERSION
	 * });
	 *
	 * // Create a new draft from published version
	 * const { id, versionId } = await update({
	 *   slug: 'posts',
	 *   id: '123',
	 *   data: { title: 'New Draft' },
	 *   versionOperation: VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED
	 * });
	 *
	 */
	const update: Update = async ({ slug, id, versionId, data, locale, versionOperation }) => {
		const now = new Date();
		const config = configInterface.getCollection(slug);
		
		if (VersionOperations.isSimpleUpdate(versionOperation)) {
			// Scenario 0: Non-versioned collections
			const tableName = slug;
			const tableLocalesName = `${slug}Locales`;

			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: tableName,
				localesTableName: tableLocalesName,
				locale
			});

			// Update main table
			await adapterUtil.updateTableRecord(db, tables, tableName, {
				recordId: id,
				data: { ...mainData, updatedAt: now }
			});

			// Update locales table if needed
			if (isLocalized) {
				await adapterUtil.upsertLocalizedData(db, tables, tableLocalesName, {
					ownerId: id,
					data: localizedData,
					locale: locale!
				});
			}
			return { id };
		} else if (VersionOperations.isSpecificVersionUpdate(versionOperation)) {
			// Scenario 1: Upadte specific version
			if (!versionId) {
				throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionId');
			}

			// First, update the root table's updatedAt
			await adapterUtil.updateTableRecord(db, tables, slug, {
				recordId: id,
				data: { updatedAt: now }
			});

			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const versionsLocalesTable = `${versionsTable}Locales`;

			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});

			// if draft is enabled on the collection
			if (config.versions && config.versions.draft && mainData.status === 'published') {
				// update all rows first to draft
				await db.update(tables[versionsTable]).set({ status: VERSIONS_STATUS.DRAFT });
			}

			// Update version directly
			await adapterUtil.updateTableRecord(db, tables, versionsTable, {
				recordId: versionId,
				data: { ...mainData, updatedAt: now }
			});

			// Update localized data if needed
			if (isLocalized) {
				await adapterUtil.upsertLocalizedData(db, tables, versionsLocalesTable, {
					ownerId: versionId,
					data: localizedData,
					locale: locale!
				});
			}

			return { id };
		} else if (VersionOperations.isNewVersionCreation(versionOperation)) {
			// Scenario 2: Version creation

			// The creation is handled by the caller operation updateById
			// so only update the the root table

			// 1. Update only the root table's updatedAt
			await adapterUtil.updateTableRecord(db, tables, slug, {
				recordId: id,
				data: { updatedAt: now }
			});

			return { id };
		} else {
			throw new RizomError(RizomError.OPERATION_ERROR, 'Unhandled version operation');
		}
	};

	/**
	 * Finds documents in a collection with support for filtering, sorting, pagination,
	 * field selection, and localization. For versioned collections, returns the latest
	 * or published version of each document.
	 *
	 * @example
	 * // Find all published posts
	 * const posts = await find({ slug: 'posts' });
	 *
	 * // Find posts with filtering and sorting
	 * const filteredPosts = await find({
	 *   slug: 'posts',
	 *   query: { where: { category: { equals: 'technology' } } },
	 *   sort: 'publishedAt:desc',
	 *   limit: 10,
	 *   offset: 0,
	 *   locale: 'en'
	 * });
	 *
	 * // Find posts with specific fields
	 * const postsWithFields = await find({
	 *   slug: 'posts',
	 *   select: ['title', 'publishedAt', 'attributes.slug']
	 * });
	 *
	 * // Include draft documents in a versioned collection
	 * const allPosts = await find({
	 *   slug: 'posts',
	 *   draft: true
	 * });
	 *
	 * @returns Array of documents matching the query criteria
	 */
	const find: FindDocuments = async ({
		slug,
		select,
		query: incomingQuery,
		sort,
		limit,
		offset,
		locale,
		draft
	}) => {
		const config = configInterface.getCollection(slug);
		const isVersioned = !!config.versions;

		let query = incomingQuery ? adapterUtil.normalizeQuery(incomingQuery) : undefined;

		if (!isVersioned) {
			// Original implementation for non-versioned collections
			const params: Dic = {
				with: buildWithParam({ slug, select, tables, configInterface, locale }) || undefined,
				orderBy: buildOrderByParam({ slug, locale, tables, configInterface, by: sort }),
				// Set a sufficient limit when offset is set but not limit as sqlite requires limit if offset present
				limit: limit || (typeof offset === 'number' ? 1000000 : undefined),
				offset: offset || undefined
			};

			if (query) {
				params.where = buildWhereParam({ query, slug, locale, db });
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
				//@ts-ignore
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
			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const withParam =
				buildWithParam({ slug: versionsTable, select, tables, configInterface, locale }) ||
				undefined;

			// If draft is not true and versions.draft enabled
			// Then we adjust the query to get the published document
			if (!draft && config.versions && config.versions.draft) {
				if (!query) {
					query = { where: { status: { equals: 'published' } } };
				} else {
					const originalWhere = { ...query.where };
					if ('and' in originalWhere && Array.isArray(originalWhere.and)) {
						query = {
							where: {
								...originalWhere,
								and: [...originalWhere.and, { status: { equals: 'published' } }]
							}
						};
					} else {
						query = {
							where: {
								and: [originalWhere, { status: { equals: 'published' } }]
							}
						};
					}
				}
			}

			const whereParam = query
				? buildWhereParam({ query, slug: versionsTable, locale, db })
				: undefined;

			// Build the query parameters for pagination and sorting of the root table
			const params: Dic = {
				// Set a sufficient limit when offset is set but not limit as sqlite requires limit if offset present
				// Set a sufficient limit when offset is set but not limit as sqlite requires limit if offset present
				limit: limit || (typeof offset === 'number' ? 1000000 : undefined),
				offset: offset,
				orderBy: buildOrderByParam({ slug, locale, tables, configInterface, by: sort })
			};

			// Remove undefined properties
			Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

			// Handle select columns for version table
			const versionSelectColumns = adapterUtil.columnsParams({
				table: tables[versionsTable],
				select
			});
			// Handle select columns for root table
			const rootSelectColumns = adapterUtil.columnsParams({ table: tables[slug], select });

			//@ts-ignore
			const rawDocs = await db.query[slug].findMany({
				...params,
				columns: rootSelectColumns,
				with: {
					[versionsTable]: {
						with: withParam,
						where: whereParam,
						orderBy: [desc(tables[versionsTable].updatedAt)],
						limit: 1,
						columns: versionSelectColumns
					}
				}
			});

			// Transform the results to include version data for eaach document
			const result = rawDocs
				.map((doc: RawDoc) => {
					// for documents that have no version try/catch the 404 and return false
					try {
						return adapterUtil.mergeRawDocumentWithVersion(doc, versionsTable, select);
					} catch (err) {
						return false;
					}
					// filter to get only retrieved docs with version
				})
				.filter(Boolean);

			return result;
		}
	};

	return {
		findById,
		deleteById,
		insert,
		update,
		find
	};
};

export default createAdapterCollectionInterface;

export type AdapterCollectionInterface = ReturnType<typeof createAdapterCollectionInterface>;

type FindDocuments = (args: {
	slug: CollectionSlug;

	select?: string[];
	query?: OperationQuery;
	sort?: string;
	limit?: number;
	offset?: number;
	locale?: string;
	/** Allow draft documents to be retrieved */
	draft?: boolean;
}) => Promise<RawDoc[]>;

type FindById = (args: {
	slug: CollectionSlug;
	id: string;
	/** Optional parameter to get a specific version */
	versionId?: string;
	locale?: string;
	select?: string[];
	/** Allow draft documents to be retrieved */
	draft?: boolean;
}) => Promise<RawDoc>;

type DeleteById = (args: { slug: CollectionSlug; id: string }) => Promise<string | undefined>;

type Insert = (args: {
	slug: CollectionSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<{ id: string; versionId: string }>;

type Update = (args: {
	slug: CollectionSlug;
	id: string;
	/** Optional parameter to specify direct version update */
	versionId?: string;
	versionOperation: (typeof VERSIONS_OPERATIONS)[keyof typeof VERSIONS_OPERATIONS];
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<{ id: string }>;
