import { and, eq, getTableColumns } from 'drizzle-orm';
import { buildWithParam } from './with.js';
import { generatePK } from './util.js';
import { buildWhereParam } from './where.js';
import { buildOrderByParam } from './orderBy.js';
import type { GenericDoc, PrototypeSlug, RawDoc } from '$lib/types/doc.js';
import type { OperationQuery } from '$lib/types/api.js';
import type { DeepPartial, Dic } from '$lib/types/util.js';
import { RizomError } from '$lib/errors/index.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { transformDataToSchema } from '../util/path.js';
import type { ConfigInterface } from 'rizom/config/index.server.js';

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
		const withParam = buildWithParam({ slug, locale, tables, configInterface });
		const orderBy = buildOrderByParam({ tables, slug, by: sort });
		// @ts-expect-error todo
		const rawDocs = await db.query[slug].findMany({
			with: withParam,
			limit: limit || undefined,
			offset: offset || undefined,
			orderBy
		});

		return new Promise((resolve) => resolve(rawDocs));
	};

	//////////////////////////////////////////////
	// Find a document by id
	//////////////////////////////////////////////
	const findById: FindById = async ({ slug, id, locale }) => {
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
		const createId = generatePK();
		const tableLocales = `${slug}Locales` as PrototypeSlug;

		if (locale && tableLocales in tables) {
			// Transform data based on table columns
			const unlocalizedColumns = getTableColumns(tables[slug]);
			const localizedColumns = getTableColumns(tables[tableLocales]);

			const unlocalizedData = transformDataToSchema(data, unlocalizedColumns);
			const localizedData = transformDataToSchema(data, localizedColumns);

			await db.insert(tables[slug]).values({
				...unlocalizedData,
				id: createId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await db.insert(tables[tableLocales]).values({
				...localizedData,
				id: generatePK(),
				ownerId: createId,
				locale
			});
		} else {
			// Transform all data based on main table columns
			const columns = getTableColumns(tables[slug]);
			const schemaData = transformDataToSchema(data, columns);

			await db.insert(tables[slug]).values({
				id: createId,
				...schemaData,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}
		return createId;
	};

	//////////////////////////////////////////////
	// Update a document
	//////////////////////////////////////////////
	const update: Update = async ({ slug, id, data, locale }) => {
		const keyTableLocales = `${slug}Locales` as PrototypeSlug;

		if (locale && keyTableLocales in tables) {
			const unlocalizedColumns = getTableColumns(tables[slug]);
			const localizedColumns = getTableColumns(tables[keyTableLocales]);

			const unlocalizedData = transformDataToSchema(data, unlocalizedColumns);
			const localizedData = transformDataToSchema(data, localizedColumns);

			// Update main table
			if (Object.keys(unlocalizedData).length) {
				await db
					.update(tables[slug])
					.set({
						...unlocalizedData,
						updatedAt: new Date()
					})
					.where(eq(tables[slug].id, id));
			}

			// Update locales table
			if (Object.keys(localizedData).length) {
				const tableLocales = tables[keyTableLocales];
				// @ts-expect-error todo
				const localizedRow = await db.query[keyTableLocales].findFirst({
					where: and(eq(tableLocales.ownerId, id), eq(tableLocales.locale, locale))
				});

				if (!localizedRow) {
					await db.insert(tableLocales).values({
						...localizedData,
						id: generatePK(),
						locale: locale,
						ownerId: id
					});
				} else {
					await db
						.update(tableLocales)
						.set(localizedData)
						.where(eq(tableLocales.id, localizedRow.id));
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
						updatedAt: new Date()
					})
					.where(eq(tables[slug].id, id));
			}
		}
		return id;
	};

	//////////////////////////////////////////////
	// Query documents with a qsQuery
	//////////////////////////////////////////////
	const query: QueryDocuments = async ({ slug, query, sort, limit, offset, locale }) => {
		const params: Dic = {
			with: buildWithParam({ slug, locale, tables, configInterface }),
			where: buildWhereParam({ query, slug, locale, db }),
			orderBy: sort ? buildOrderByParam({ tables, slug, by: sort }) : undefined,
			limit: limit || undefined,
			offset: offset || undefined
		};

		// Remove undefined properties
		Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

		// @ts-expect-error todo
		const result = await db.query[slug].findMany(params);

		return result;
	};

	//////////////////////////////////////////////
	// Select
	//////////////////////////////////////////////
	const select: SelectDocuments = async ({ slug, select, query, sort, limit, offset, locale }) => {
		
		const params: Dic = {
			with: buildWithParam({ slug, select, tables, configInterface, locale }) || undefined,
			orderBy: sort ? buildOrderByParam({ tables, slug, by: sort }) : undefined,
			limit: limit || undefined,
			offset: offset || undefined
		};
		
		if(query){
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
		if(Object.keys(selectColumns).length > 0){
			// @ts-expect-error todo
			return await db.query[slug].findMany({ 
				columns: selectColumns,
				...params 
			});
		}else{
			// @ts-expect-error todo
			return await db.query[slug].findMany(params);
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
	locale?: string;
	select?: string[];
}) => Promise<RawDoc>;

type DeleteById = (args: { slug: PrototypeSlug; id: string }) => Promise<string | undefined>;

type Insert = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<string>;

type Update = (args: {
	slug: PrototypeSlug;
	id: string;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<string | undefined>;
