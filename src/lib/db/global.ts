import { and, eq, getTableColumns } from 'drizzle-orm';
import { generatePK } from './utils.js';
import { buildWithParam } from './with.js';
import { pick } from '../utils/object.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

type GlobalInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
};

const createAdapterGlobalInterface = ({ db, tables }: GlobalInterfaceArgs) => {
	//
	type KeyOfTables = keyof typeof tables;

	/** Get global doc */
	const get: Get = async ({ slug, locale }) => {
		const withParam = buildWithParam({ slug, locale });

		// @ts-expect-error suck
		let doc = await db.query[slug].findFirst({
			with: withParam
		});

		if (!doc) {
			await createGlobal(slug, {}, locale);
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

	/** Global Create */
	const createGlobal = async (slug: string, values: Partial<GenericDoc>, locale?: string) => {
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
		const global = rows[0];

		const columns = Object.keys(getTableColumns(tables[slug]));
		const values = pick(columns, data);

		await db
			.update(tables[slug])
			.set({
				...values,
				updatedAt: new Date()
			})
			.where(eq(tables[slug].id, global.id));

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
				where: and(eq(tableLocales.parentId, global.id), eq(tableLocales.locale, locale))
			});

			if (!localizedRow) {
				await db.insert(tableLocales).values({
					...localizedValues,
					id: generatePK(),
					locale: locale,
					parentId: global.id
				});
			} else {
				await db
					.update(tableLocales)
					.set(localizedValues)
					.where(and(eq(tableLocales.parentId, global.id), eq(tableLocales.locale, locale)));
			}
		}

		return await get({ slug, locale });
	};

	return {
		update,
		createGlobal,
		get
	};
};

export default createAdapterGlobalInterface;

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type Get = (args: { slug: PrototypeSlug; locale?: string; depth?: number }) => Promise<GenericDoc>;

type Update = (args: {
	slug: PrototypeSlug;
	data: Partial<GenericDoc>;
	locale?: string;
}) => Promise<GenericDoc>;
