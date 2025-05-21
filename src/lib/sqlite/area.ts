import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { buildWithParam } from './with.js';
import type { GenericDoc, PrototypeSlug, RawDoc } from '$lib/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { transformDataToSchema } from '../util/schema.js';
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
		const tableLocales = `${slug}Locales` as KeyOfTables;

		if (locale && tableLocales in tables) {
			const unlocalizedColumns = getTableColumns(tables[slug]);
			const localizedColumns = getTableColumns(tables[tableLocales]);

			// Fill required fields without default value 
			// with a placeholder value to prevent error on area creation
			const unlocalizedData = transformDataToSchema(values, unlocalizedColumns, { fillNotNull : true });
			const localizedData = transformDataToSchema(values, localizedColumns, { fillNotNull : true });

			await db.insert(tables[slug]).values({
				...unlocalizedData,
				id: createId
			});

			await db.insert(tables[tableLocales]).values({
				...localizedData,
				id: generatePK(),
				ownerId: createId,
				locale
			});
		} else {
			const columns = getTableColumns(tables[slug]);
			// Fill required fields with default values if not provide to prevent error on area creation
			const schemaData = transformDataToSchema(values, columns, { fillNotNull : true });
			// console.log(Object.keys(columns))
			await db.insert(tables[slug]).values({
				...schemaData,
				id: createId
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
			if (locale && keyTableLocales in tables) {
				const unlocalizedColumns = getTableColumns(tables[slug]);
				const localizedColumns = getTableColumns(tables[keyTableLocales as PrototypeSlug]);

				const unlocalizedData = transformDataToSchema(data, unlocalizedColumns);
				const localizedData = transformDataToSchema(data, localizedColumns);

				// Update main table
				if (Object.keys(unlocalizedData).length) {
					await db
						.update(tables[slug])
						.set({
							...unlocalizedData,
							updatedAt: now
						})
						.where(eq(tables[slug].id, area.id));
				}

				// Update locales table
				if (Object.keys(localizedData).length) {
					const tableLocales = tables[keyTableLocales as PrototypeSlug];
					// @ts-expect-error todo...
					const localizedRow = await db.query[keyTableLocales as PrototypeSlug].findFirst({
						where: and(eq(tableLocales.ownerId, area.id), eq(tableLocales.locale, locale))
					});

					if (!localizedRow) {
						await db.insert(tableLocales).values({
							...localizedData,
							id: generatePK(),
							locale: locale,
							ownerId: area.id
						});
					} else {
						await db
							.update(tableLocales)
							.set(localizedData)
							.where(and(eq(tableLocales.ownerId, area.id), eq(tableLocales.locale, locale)));
					}
				}
			} else {
				const columns = getTableColumns(tables[slug]);
				const schemaData = transformDataToSchema(data, columns);

				if (Object.keys(schemaData).length) {
					await db
						.update(tables[slug])
						.set({
							...schemaData,
							updatedAt: now
						})
						.where(eq(tables[slug].id, area.id));
				}
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

			if (locale && versionsLocalesTable in tables) {
				// Handle localized fields
				const unlocalizedColumns = getTableColumns(tables[versionsTable]);
				const localizedColumns = getTableColumns(tables[versionsLocalesTable]);

				const unlocalizedData = transformDataToSchema(data, unlocalizedColumns);
				const localizedData = transformDataToSchema(data, localizedColumns);

				// Update version directly
				if (Object.keys(unlocalizedData).length) {
					await db
						.update(tables[versionsTable])
						.set({
							...unlocalizedData,
							updatedAt: now
						})
						.where(eq(tables[versionsTable].id, versionId));
				}

				// Update localized data if any
				if (Object.keys(localizedData).length) {
					const tableLocales = tables[versionsLocalesTable];
					// @ts-expect-error todo
					const localizedRow = await db.query[versionsLocalesTable].findFirst({
						where: and(eq(tableLocales.ownerId, versionId), eq(tableLocales.locale, locale))
					});

					if (localizedRow) {
						await db
							.update(tableLocales)
							.set(localizedData)
							.where(
								and(eq(tableLocales.ownerId, versionId), eq(tableLocales.locale, locale))
							);
					} else {
						await db.insert(tableLocales).values({
							id: generatePK(),
							...localizedData,
							ownerId: versionId,
							locale
						});
					}
				}
			} else {
				// Handle non-localized fields
				const columns = getTableColumns(tables[versionsTable]);
				const schemaData = transformDataToSchema(data, columns);

				if (Object.keys(schemaData).length) {
					await db
						.update(tables[versionsTable])
						.set({
							...schemaData,
							updatedAt: now
						})
						.where(eq(tables[versionsTable].id, versionId));
				}
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

			if (locale && versionsLocalesTable in tables) {
				// Handle localized fields
				const unlocalizedColumns = getTableColumns(tables[versionsTable]);
				const localizedColumns = getTableColumns(tables[versionsLocalesTable]);

				const unlocalizedData = transformDataToSchema(data, unlocalizedColumns);
				const localizedData = transformDataToSchema(data, localizedColumns);

				// Insert new version
				await db.insert(tables[versionsTable]).values({
					id: createVersionId,
					...unlocalizedData,
					ownerId: area.id,
					createdAt: now,
					updatedAt: now
				});

				// Insert localized data if any
				if (Object.keys(localizedData).length) {
					await db.insert(tables[versionsLocalesTable]).values({
						id: generatePK(),
						...localizedData,
						ownerId: createVersionId,
						locale
					});
				}
			} else {
				// Handle non-localized fields
				const columns = getTableColumns(tables[versionsTable]);
				const schemaData = transformDataToSchema(data, columns);

				// Insert new version
				await db.insert(tables[versionsTable]).values({
					id: createVersionId,
					...schemaData,
					ownerId: area.id,
					createdAt: now,
					updatedAt: now
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
