import { and, eq, getTableColumns } from 'drizzle-orm';
import { buildWithParam } from './with.js';
import { generatePK } from './utils.js';
import { pick } from '../utils/object.js';
import { buildWhereParam } from './where.js';
import { buildOrderByParam } from './orderBy.js';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { OperationQuery } from 'rizom/types/api.js';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter.js';
import type { Dic } from 'rizom/types/utility.js';

const createAdapterCollectionInterface = ({ db, tables }: GenericAdapterInterfaceArgs) => {
	//////////////////////////////////////////////
	// Find All documents in a collection
	//////////////////////////////////////////////
	const findAll: FindAll = async ({ slug, sort, limit, locale }) => {
		const withParam = buildWithParam({ slug, locale });
		const orderBy = buildOrderByParam({ tables, slug, by: sort });
		// @ts-expect-error suck
		const rawDocs = await db.query[slug].findMany({
			with: withParam,
			limit: limit || undefined,
			orderBy
		});

		return new Promise((resolve) => resolve(rawDocs));
	};

	//////////////////////////////////////////////
	// Find a document by id
	//////////////////////////////////////////////
	const findById: FindById = async ({ slug, id, locale }) => {
		const withParam = buildWithParam({ slug, locale });
		// @ts-expect-error foo
		const doc = await db.query[slug].findFirst({
			where: eq(tables[slug].id, id),
			with: withParam
		});

		if (!doc) {
			return undefined;
		}

		return doc;
	};

	//////////////////////////////////////////////
	// Delete a document by ID
	//////////////////////////////////////////////
	const deleteById: DeleteById = async ({ slug, id }) => {
		const docs = await db.delete(tables[slug]).where(eq(tables[slug].id, id)).returning();
		if (!docs || !Array.isArray(docs) || !docs.length) {
			return undefined;
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
			const unlocalizedColumns = Object.keys(getTableColumns(tables[slug])) as (keyof GenericDoc)[];

			const localizedColumns = Object.keys(
				getTableColumns(tables[tableLocales])
			) as (keyof GenericDoc)[];

			await db.insert(tables[slug]).values({
				...pick(unlocalizedColumns, data),
				id: createId,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			await db.insert(tables[tableLocales]).values({
				...pick(localizedColumns, data),
				id: generatePK(),
				parentId: createId,
				locale
			});
		} else {
			await db.insert(tables[slug]).values({
				id: createId,
				...data,
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
		const columns = Object.keys(getTableColumns(tables[slug]));
		const values = pick(columns, data);

		await db
			.update(tables[slug])
			.set({
				...values,
				updatedAt: new Date()
			})
			.where(eq(tables[slug].id, id));

		const keyTableLocales = `${slug}Locales` as PrototypeSlug;
		if (locale && keyTableLocales in tables) {
			const tableLocales = tables[keyTableLocales];

			const localizedColumns = Object.keys(getTableColumns(tableLocales));
			const localizedValues = pick(localizedColumns, data);

			if (!Object.keys(localizedValues).length) return;

			// @ts-expect-error todo
			const localizedRow = await db.query[keyTableLocales].findFirst({
				where: and(eq(tableLocales.parentId, id), eq(tableLocales.locale, locale))
			});

			if (!localizedRow) {
				await db.insert(tableLocales).values({
					...localizedValues,
					id: generatePK(),
					locale: locale,
					parentId: id
				});
			} else {
				await db
					.update(tableLocales)
					.set(localizedValues)
					.where(eq(tableLocales.id, localizedRow.id));
			}
		}
		return id;
	};

	//////////////////////////////////////////////
	// Query documents with a qsQuery
	//////////////////////////////////////////////
	const query: QueryDocuments = async ({ slug, query, sort, limit, locale }) => {
		const params: Dic = {
			with: buildWithParam({ slug, locale }),
			where: buildWhereParam({ query, slug, locale, db }),
			orderBy: sort ? buildOrderByParam({ tables, slug, by: sort }) : undefined,
			limit: limit || undefined
		};

		// Remove undefined properties
		Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

		// @ts-expect-error todo
		return await db.query[slug].findMany(params);
	};

	return {
		findAll,
		findById,
		deleteById,
		insert,
		update,
		query
	};
};

export default createAdapterCollectionInterface;

//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type FindAll = (args: {
	slug: PrototypeSlug;
	sort?: string;
	limit?: number;
	locale?: string;
}) => Promise<GenericDoc[]>;

type QueryDocuments = (args: {
	slug: PrototypeSlug;
	query: OperationQuery;
	sort?: string;
	limit?: number;
	locale?: string;
}) => Promise<GenericDoc[]>;

type FindById = (args: {
	slug: PrototypeSlug;
	id: string;
	locale?: string;
}) => Promise<GenericDoc | undefined>;

type DeleteById = (args: { slug: PrototypeSlug; id: string }) => Promise<string | undefined>;

type Insert = (args: {
	slug: PrototypeSlug;
	data: Partial<GenericDoc>;
	locale?: string;
}) => Promise<string>;

type Update = (args: {
	slug: PrototypeSlug;
	id: string;
	data: Partial<GenericDoc>;
	locale?: string;
}) => Promise<string | undefined>;
