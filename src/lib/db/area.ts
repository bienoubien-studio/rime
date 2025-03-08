import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './util.js';
import { buildWithParam } from './with.js';
import { pick } from '../util/object.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

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
			//
			const unlocalizedColumns = Object.keys(getTableColumns(tables[slug])) as (keyof GenericDoc)[];

			const localizedColumns = Object.keys(
				getTableColumns(tables[tableLocales as KeyOfTables])
			) as (keyof GenericDoc)[];

			await db.insert(tables[slug]).values({
				...pick(unlocalizedColumns, values),
				id: createId
			});

			await db.insert(tables[tableLocales as KeyOfTables]).values({
				...pick(localizedColumns, values),
				id: generatePK(),
				parentId: createId,
				locale
			});
		} else {
			await db.insert(tables[slug]).values({
				...values,
				id: createId
			});
		}
	};

	const update: Update = async ({ slug, data, locale }) => {
		const rows = await db.select({ id: tables[slug].id }).from(tables[slug]);
		const area = rows[0];

		const columns = Object.keys(getTableColumns(tables[slug]));
		const values = pick(columns, data);

		await db
			.update(tables[slug])
			.set({
				...values,
				updatedAt: new Date()
			})
			.where(eq(tables[slug].id, area.id));

		const keyTableLocales = `${slug}Locales`;
		if (locale && keyTableLocales in tables) {
			const tableLocales = tables[keyTableLocales as PrototypeSlug];

			const localizedColumns = Object.keys(getTableColumns(tableLocales));

			const localizedValues = pick(localizedColumns, data);
			if (!Object.keys(localizedValues).length) {
				return await get({ slug, locale });
			}

			// @ts-expect-error todo...
			const localizedRow = await db.query[keyTableLocales as PrototypeSlug].findFirst({
				where: and(eq(tableLocales.parentId, area.id), eq(tableLocales.locale, locale))
			});

			if (!localizedRow) {
				await db.insert(tableLocales).values({
					...localizedValues,
					id: generatePK(),
					locale: locale,
					parentId: area.id
				});
			} else {
				await db
					.update(tableLocales)
					.set(localizedValues)
					.where(and(eq(tableLocales.parentId, area.id), eq(tableLocales.locale, locale)));
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
	data: Partial<GenericDoc>;
	locale?: string;
}) => Promise<GenericDoc>;
