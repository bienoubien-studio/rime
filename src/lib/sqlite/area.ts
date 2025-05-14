import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { buildWithParam } from './with.js';
import type { GenericDoc, PrototypeSlug } from '$lib/types/doc.js';
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
	const get: Get = async ({ slug, locale, select }) => {
		
		const params: Dic = {
			with : buildWithParam({ slug, select, locale, tables, configInterface }) || undefined
		}

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

			if(Object.keys(selectColumns).length){
				params.columns = selectColumns
			}
		}
		
		// @ts-expect-error suck
		let doc = await db.query[slug].findFirst(params);

		if (!doc) {
			const areaConfig = configInterface.getArea(slug)
			if(!areaConfig) throw new RizomError(RizomError.INIT, slug + 'is not an area, should never happen')
			
			await createArea(slug, createBlankDocument(areaConfig), locale);
			// @ts-expect-error suck
			doc = await db.query[slug].findFirst(params);
		}
		if (!doc) {
			throw new Error('Database error');
		}
		return doc;
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

	const update: Update = async ({ slug, data, locale }) => {
		const rows = await db.select({ id: tables[slug].id }).from(tables[slug]);
		const area = rows[0];

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
						updatedAt: new Date()
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
						updatedAt: new Date()
					})
					.where(eq(tables[slug].id, area.id));
			}
		}

		return await get({ slug, locale });
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
}) => Promise<GenericDoc>;

type Update = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<GenericDoc>;
