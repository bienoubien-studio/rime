import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK, updateTableRecord, insertTableRecord, upsertLocalizedData, prepareSchemaData } from './util.js';
import { buildWithParam } from './with.js';
import type { GenericDoc, PrototypeSlug, RawDoc } from '$lib/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DeepPartial, Dic } from '$lib/types/util.js';
import type { ConfigInterface } from '../config/index.server.js';
import { createBlankDocument } from 'rizom/util/doc.js';
import { RizomError } from 'rizom/errors/index.js';

type AreaInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
	configInterface: ConfigInterface
};

const createAdapterAreaInterface = ({ db, tables, configInterface }: AreaInterfaceArgs) => {
	//
	type KeyOfTables = keyof typeof tables;

	/** Get area doc */
	const get: Get = async ({ slug, locale, select, versionId }) => {
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
			// Implementation for versioned areas
			const versionsTable = `${slug}Versions`;
			const withParam = buildWithParam({ slug: versionsTable, select, locale, tables, configInterface });

			// Configure the query based on whether we want a specific version or the latest
			let params;
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
				// Otherwise get the latest version
				params = {
					with: {
						[versionsTable]: {
							with: withParam,
							orderBy: [{ column: tables[versionsTable].updatedAt, order: 'desc' }],
							limit: 1
						}
					}
				};
			}

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

				// Apply the select columns to the versions table query
				if (Object.keys(selectColumns).length > 0) {
					// Add the columns to the with parameter instead of directly to the query
					// as Drizzle doesn't support direct column selection on nested queries
					// We'll handle the selection after we get the results
				}
			}

			// @ts-expect-error suck
			let doc = await db.query[slug].findFirst(params);

			// If no area exists yet, create it
			if (!doc) {
				await createArea(slug, createBlankDocument(areaConfig), locale);
				// @ts-expect-error suck
				doc = await db.query[slug].findFirst(params);
			}

			if (!doc) {
				throw new Error('Database error');
			}

			// Check if we have version data
			if (!doc[versionsTable] || doc[versionsTable].length === 0) {
				throw new RizomError(RizomError.NOT_FOUND, 'area found but without version, should never happen');
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

	/** Area Create */
	const createArea = async (slug: string, values: Partial<GenericDoc>, locale?: string) => {
		
		const createId = generatePK();
		const tableLocales = `${slug}Locales`;

		// Prepare data for insertion using the shared utility function
		const { mainData, localizedData, isLocalized } = prepareSchemaData(values, {
			tables,
			mainTableName: slug,
			localesTableName: tableLocales,
			locale,
			fillNotNull: true
		});

		// Insert main record
		await insertTableRecord(db, tables, slug, {
			...mainData,
			id: createId
		});

		// Insert localized data if needed
		if (isLocalized) {
			await insertTableRecord(db, tables, tableLocales, {
				...localizedData,
				ownerId: createId,
				locale
			});
		}
	};
	
	const update: Update = async ({ slug, data, locale, versionId }) => {
		const now = new Date();
		const areaConfig = configInterface.getArea(slug);
		if (!areaConfig) throw new RizomError(RizomError.INIT, slug + ' is not an area, should never happen');
		
		const hasVersions = !!areaConfig.versions;
		const rows = await db.select({ id: tables[slug].id }).from(tables[slug]);
		const area = rows[0];

		if (!hasVersions) {
			// Original implementation for non-versioned areas
			const keyTableLocales = `${slug}Locales`;
			// Prepare data for update using the shared utility function
			const { mainData, localizedData, isLocalized } = prepareSchemaData(data, {
				tables,
				mainTableName: slug,
				localesTableName: keyTableLocales,
				locale
			});

			// Update main table
			await updateTableRecord(db, tables, slug, {
				recordId: area.id,
				data: mainData,
				timestamp: now
			});

			// Update localized data if needed
			if (isLocalized) {
				await upsertLocalizedData(db, tables, keyTableLocales, {
					ownerId: area.id,
					data: localizedData,
					locale: locale!
				});
			}

			// For non-versioned areas, versionId is the same as id
			return { id: area.id, versionId: area.id };
		} else if (hasVersions && versionId) {
			// Scenario 2: Update a specific version directly

			// 1. First, update the root table's updatedAt
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));
			
			const versionsTable = `${slug}Versions`;
			const versionsLocalesTable = `${versionsTable}Locales`;

			// Prepare data for update using the shared utility function
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

			// Return both the area id and the version id
			return { id: area.id, versionId };
		} else {
			// Scenario 1: Update root and create a new version
			// 1. First, update the root table's updatedAt
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));

			// 2. Create a new version entry
			const versionsTable = `${slug}Versions`;
			const versionsLocalesTable = `${versionsTable}Locales`;
			const createVersionId = generatePK();

			// Prepare data for insertion using the shared utility function
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
				ownerId: area.id,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized) {
				await insertTableRecord(db, tables, versionsLocalesTable, {
					...localizedData,
					ownerId: createVersionId,
					locale
				});
			}

			// Return both the area id and the new version id
			return { id: area.id, versionId: createVersionId };
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

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type Get = (args: { 
	slug: PrototypeSlug; 
	locale?: string; 
	depth?: number;
	select?: string[];
	/** Optional parameter to get a specific version */
	versionId?: string;
}) => Promise<RawDoc>;

type Update = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
	/** Optional parameter to specify direct version update */
	versionId?: string;
}) => Promise<{ id: string; versionId: string }>;
