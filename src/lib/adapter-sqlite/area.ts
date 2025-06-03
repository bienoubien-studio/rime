import { desc, eq, getTableColumns } from 'drizzle-orm';
import { buildWithParam } from './with.js';
import type { GenericDoc, PrototypeSlug, RawDoc } from '$lib/core/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DeepPartial, Dic } from '$lib/util/types.js';
import type { ConfigInterface } from '../core/config/index.server.js';
import { createBlankDocument } from '$lib/util/doc.js';
import { RizomError } from '$lib/core/errors/index.js';
import * as adapterUtil from './util.js';
import * as schemaUtil from '$lib/util/schema.js'
import { VERSIONS_OPERATIONS, VersionOperations } from '$lib/core/operations/shared/versions.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';

type AreaInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
	configInterface: ConfigInterface
};

/**
 * Creates an area interface for SQLite adapter operations with CRUD functionality.
 * Handles both versioned and non-versioned areas with support for localization.
 * 
 * @example
 * const areaInterface = createAdapterAreaInterface({
 *   db: sqliteDb,
 *   tables: schema,
 *   configInterface: config
 * });
 * 
 * // Use the interface to perform operations
 * await areaInterface.get({ slug: 'settings' });
 */
const createAdapterAreaInterface = ({ db, tables, configInterface }: AreaInterfaceArgs) => {

	/**
	 * Retrieves an area document. If the area doesn't exist, it creates a blank one.
	 * For versioned areas, returns either a specific version (if versionId is provided)
	 * or the latest/published version.
	 * 
	 * @example
	 * // Get an area
	 * const settings = await get({ slug: 'settings' });
	 * 
	 * // Get an area with specific fields and locale
	 * const siteInfo = await get({ 
	 *   slug: 'site-info', 
	 *   select: ['title', 'description'],
	 *   locale: 'en'
	 * });
	 * 
	 * // Get a specific version of an area
	 * const oldSettings = await get({ 
	 *   slug: 'settings', 
	 *   versionId: 'v123'
	 * });
	 * 
	 * @returns The area document with all its fields and relations
	 * @throws RizomError when the area configuration doesn't exist
	 */
	const get: Get = async ({ slug, locale, select, versionId, draft }) => {
		const areaConfig = configInterface.getArea(slug);
		if (!areaConfig) throw new RizomError(RizomError.INIT, slug + ' is not an area, should never happen');

		const hasVersions = !!areaConfig.versions;

		if (!hasVersions) {
			// Original implementation for non-versioned areas
			const params: Dic = {
				with: buildWithParam({ slug, select, locale, tables, configInterface }) || undefined
			};

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

				if (Object.keys(selectColumns).length) {
					params.columns = selectColumns;
				}
			}

			// @ts-expect-error suck
			let doc = await db.query[slug].findFirst(params);

			if (!doc) {
				await createArea(slug, createBlankDocument(areaConfig), locale);
				// @ts-expect-error suck
				doc = await db.query[slug].findFirst(params);
			}
			if (!doc) {
				throw new Error('Database error');
			}
			return doc;
		} else {

			// First check for record presence
			// @ts-expect-error suck
			let area = await db.query[slug].findFirst({ id: true });

			// If no area exists yet, create it
			if (!area) {
				await createArea(slug, createBlankDocument(areaConfig), locale);
			}

			// Implementation for versioned areas
			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const withParam = buildWithParam({ slug: versionsTable, select, locale, tables, configInterface });

			// Configure the query based on whether we want a specific version or the latest
			// For the "save in a new draft" action we need to get the published version
			let params: Dic;

			if (versionId) {
				// If versionId is provided, get that specific version
				params = {
					with: {
						[versionsTable]: {
							with: withParam,
							where: eq(tables[versionsTable].id, versionId)
						}
					}
				};
			} else {
				// If versions.draft enabled and draft is not true 
				// then get the published document
				// else get the latest
				params = {
					with: {
						[versionsTable]: {
							with: withParam,
							...adapterUtil.buildPublishedOrLatestVersionParams({ draft, config: areaConfig, table: tables[versionsTable] })
						}
					}
				};
			}

			// Handle select columns for version table
			params.with[versionsTable].columns = adapterUtil.columnsParams({ table: tables[versionsTable], select })
			// Handle select columns for root table
			params.columns = adapterUtil.columnsParams({ table: tables[slug], select })

			// @ts-expect-error suck
			let doc = await db.query[slug].findFirst(params);
			
			if (!doc) {
				throw new RizomError(RizomError.OPERATION_ERROR);
			}

			return adapterUtil.mergeDocumentWithVersion(doc, versionsTable, select);
		}
	};

	/**
	 * Creates a new area document. For versioned areas, creates both
	 * the root document and its first version. For non-versioned areas,
	 * creates a single document with the provided data.
	 * 
	 * @example
	 * // Create a new area
	 * await createArea(
	 *   'settings',
	 *   { theme: 'light', notifications: true },
	 *   'en'
	 * );
	 * 
	 * @returns For versioned areas, returns object with id and versionId
	 */
	const createArea = async (slug: string, values: Partial<GenericDoc>, locale?: string) => {
		const now = new Date();
		const config = configInterface.getArea(slug);

		const hasVersions = !!config.versions;

		if (hasVersions) {
			// Create root document first
			const docId = await adapterUtil.insertTableRecord(db, tables, slug, {
				createdAt: now,
				updatedAt: now
			});

			// Generate version ID
			const versionsTableName = schemaUtil.makeVersionsSlug(slug)

			// Prepare data for versions table
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(values, {
				tables,
				mainTableName: versionsTableName,
				localesTableName: `${versionsTableName}Locales`,
				locale
			});

			if (config.versions && config.versions.draft) {
				mainData.status = 'published'
			}

			// Insert version record
			const versionId = await adapterUtil.insertTableRecord(db, tables, versionsTableName, {
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

			const tableLocales = `${slug}Locales`;

			// Prepare data for insertion using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(values, {
				tables,
				mainTableName: slug,
				localesTableName: tableLocales,
				locale,
				fillNotNull: true
			});

			// Insert main record
			const createId = await adapterUtil.insertTableRecord(db, tables, slug, {
				...mainData
			});

			// Insert localized data if needed
			if (isLocalized) {
				await adapterUtil.insertTableRecord(db, tables, tableLocales, {
					...localizedData,
					ownerId: createId,
					locale
				});
			}
		}
	};

	/**
	 * Updates an area document using different versioning strategies.
	 * Supports multiple update patterns:
	 * - Simple update for non-versioned areas
	 * - Direct version update for versioned areas
	 * - Creating new versions from existing ones
	 * - Publishing draft versions
	 * 
	 * @example
	 * // Update a non-versioned area
	 * const { id, versionId } = await update({
	 *   slug: 'settings',
	 *   data: { theme: 'dark' },
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE
	 * });
	 * 
	 * // Update a specific version
	 * const { id, versionId } = await update({
	 *   slug: 'site-info',
	 *   data: { title: 'Updated Title' },
	 *   versionId: 'v456',
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE_VERSION
	 * });
	 * 
	 * // Create a new draft from published version
	 * const { id, versionId } = await update({
	 *   slug: 'settings',
	 *   data: { theme: 'system' },
	 *   versionOperation: VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED
	 * });
	 * 
	 * @returns Object containing the IDs of the updated area and version
	 * @throws RizomError when operation fails or version ID is missing when required
	 */
	const update: Update = async ({ slug, data, locale, versionId, versionOperation }) => {
		const now = new Date();
		const areaConfig = configInterface.getArea(slug);

		const rows = await db.select({ id: tables[slug].id }).from(tables[slug]);
		const area = rows[0];

		// Simple update for non-versioned areas
		if (VersionOperations.isSimpleUpdate(versionOperation)) {
			// Original implementation for non-versioned areas
			const keyTableLocales = `${slug}Locales`;
			// Prepare data for update using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: slug,
				localesTableName: keyTableLocales,
				locale
			});

			// Update main table
			await adapterUtil.updateTableRecord(db, tables, slug, {
				recordId: area.id,
				data: { ...mainData, updatedAt: now }
			});

			// Update localized data if needed
			if (isLocalized) {
				await adapterUtil.upsertLocalizedData(db, tables, keyTableLocales, {
					ownerId: area.id,
					data: localizedData,
					locale: locale!
				});
			}

			// For non-versioned areas, versionId is the same as id
			return { id: area.id, versionId: area.id };

		} else if (VersionOperations.isSpecificVersionUpdate(versionOperation) ||
			VersionOperations.isPublishedUpdate(versionOperation)) {

			if (!versionId) {
				throw new RizomError(RizomError.OPERATION_ERROR, "missing versionId")
			}
			// Update a specific version directly
			// 1. First, update the root table's updatedAt
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));

			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const versionsLocalesTable = `${versionsTable}Locales`;

			// Prepare data for update using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});


			// if draft is enabled on the collection
			if (areaConfig.versions && areaConfig.versions.draft && mainData.status === 'published') {
				// update all rows first to draft
				await db.update(tables[versionsTable]).set({ status: VERSIONS_STATUS.DRAFT })
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

			// Return both the area id and the version id
			return { id: area.id, versionId };

		} else if (VersionOperations.isNewVersionCreation(versionOperation)) {

			// Scenario 1: Update root and create a new version
			// 1. First, update the root table's updatedAt
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));

			// 2. Create a new version entry
			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const versionsLocalesTable = `${versionsTable}Locales`;

			// Prepare data for insertion using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});

			// Insert new version
			const createVersionId = await adapterUtil.insertTableRecord(db, tables, versionsTable, {
				...mainData,
				ownerId: area.id,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized) {
				await adapterUtil.insertTableRecord(db, tables, versionsLocalesTable, {
					...localizedData,
					ownerId: createVersionId,
					locale
				});
			}

			// Return both the area id and the new version id
			return { id: area.id, versionId: createVersionId };
		} else {
			throw new RizomError(RizomError.OPERATION_ERROR, 'Unhandled version operation')
		}

	};

	return {
		update,
		createArea,
		get
	};
};

export default createAdapterAreaInterface;

export type AdapterAreaInterface = ReturnType<typeof createAdapterAreaInterface>;

/****************************************************/
/* Types
/****************************************************/

type Get = (args: {
	slug: PrototypeSlug;
	locale?: string;
	depth?: number;
	select?: string[];
	/** Optional parameter to get a specific version */
	versionId?: string;
	/** Optional parameter if versionId is not defined and draft=true
	 * 	it will get the latest doc no matter its status
	 * 	else the published document will be retrieved
	 */
	draft?: boolean;
}) => Promise<RawDoc>;



type Update = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
	/** Optional parameter to specify direct version update */
	versionId?: string;
	versionOperation: typeof VERSIONS_OPERATIONS[keyof typeof VERSIONS_OPERATIONS];
}) => Promise<{ id: string; versionId: string }>;
