import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { buildWithParam } from './with.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { transformDataToSchema } from '../util/path.js';
import type { DeepPartial } from 'rizom/types/util.js';

type AreaInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
};

const createAdapterAreaInterface = ({ db, tables }: AreaInterfaceArgs) => {
	//
	type KeyOfTables = keyof typeof tables;

	/** Get area doc */
	const get: Get = async ({ slug, locale }) => {
		const withParam = buildWithParam({ slug, locale });

		// @ts-expect-error suck
		let doc = await db.query[slug].findFirst({
			with: withParam
		});

		if (!doc) {
			await createArea(slug, {}, locale);
			// @ts-expect-error suck
			doc = await db.query[slug].findFirst({
				with: withParam
			});
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

			const unlocalizedData = transformDataToSchema(values, unlocalizedColumns);
			const localizedData = transformDataToSchema(values, localizedColumns);

			await db.insert(tables[slug]).values({
				...unlocalizedData,
				id: createId
			});

			await db.insert(tables[tableLocales]).values({
				...localizedData,
				id: generatePK(),
				parentId: createId,
				locale
			});
		} else {
			const columns = getTableColumns(tables[slug]);
			const schemaData = transformDataToSchema(values, columns);

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
					where: and(eq(tableLocales.parentId, area.id), eq(tableLocales.locale, locale))
				});

				if (!localizedRow) {
					await db.insert(tableLocales).values({
						...localizedData,
						id: generatePK(),
						locale: locale,
						parentId: area.id
					});
				} else {
					console.log('localizedData', localizedData);
					console.log(area.id);
					console.log(locale);
					await db
						.update(tableLocales)
						.set(localizedData)
						.where(and(eq(tableLocales.parentId, area.id), eq(tableLocales.locale, locale)));
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

type Get = (args: { slug: PrototypeSlug; locale?: string; depth?: number }) => Promise<GenericDoc>;

type Update = (args: {
	slug: PrototypeSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
}) => Promise<GenericDoc>;
