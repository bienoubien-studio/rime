import { and, eq, getTableColumns, inArray, isNull, or, type SQLWrapper } from 'drizzle-orm';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter';

import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility';
import { omit } from 'rizom/utils/object';

const createAdapterRelationsInterface = ({ db, tables }: GenericAdapterInterfaceArgs) => {
	//
	const deleteFromPaths: DeleteFromPaths = async ({ parentSlug, parentId, paths, locale }) => {
		if (paths.length === 0) return true;

		const relationTableName = `${parentSlug}Rels`;
		const table = tables[relationTableName];
		if (!table) return true;

		const conditions: SQLWrapper[] = [eq(table.parentId, parentId)];
		if (locale) {
			conditions.push(eq(table.locale, locale));
		}
		const existingRelations = await db
			.select({ id: table.id, path: table.path })
			.from(table)
			.where(and(...conditions));

		const toDelete = existingRelations
			.filter((row) => paths.some((path) => row.path.startsWith(path)))
			.map((row) => row.id);

		if (!toDelete.length) return true;

		await db.delete(table).where(inArray(table.id, toDelete));

		return true;
	};

	const create: Create = async ({ parentSlug, parentId, relations }) => {
		const relationTableName = `${parentSlug}Rels`;
		const table = tables[relationTableName];

		for (const relation of relations) {
			if (!relation.relationId) continue;

			const relationToIdKey = `${relation.relationTo}Id`;
			const values: Dic = {
				path: relation.path,
				position: relation.position,
				[relationToIdKey]: relation.relationId,
				parentId
			};

			if (relation.locale) {
				values.locale = relation.locale;
			}
			try {
				await db.insert(table).values(values);
			} catch (err: any) {
				console.error('error in db/relations create' + err.message);
				return false;
			}
		}
		return true;
	};

	const update: Update = async ({ parentSlug, relations }) => {
		const relationTableName = `${parentSlug}Rels`;
		const table = tables[relationTableName];

		try {
			await Promise.all(
				relations.map((relation) =>
					db
						.update(table)
						.set(omit(['id'], relation))
						.where(eq(table.id, relation.id))
				)
			);
		} catch (err: any) {
			console.error('error in db/relations update' + err.message);
			return false;
		}

		return true;
	};

	const deleteRelations: Delete = async ({ parentSlug, relations }) => {
		const relationTableName = `${parentSlug}Rels`;
		const table = tables[relationTableName];

		if (relations.length === 0) return true;

		const relationIds = relations
			.map((rel) => rel.id)
			.filter((id): id is string => id !== undefined);
		if (relationIds.length === 0) return true;

		try {
			await db.delete(table).where(inArray(table.id, relationIds));
		} catch (err: any) {
			console.error('error in db/relations delete' + err.message);
			return false;
		}

		return true;
	};

	const getAll: GetAllRelations = async ({ parentSlug, parentId, locale }) => {
		const relationTableName = `${parentSlug}Rels`;

		// If the collection doesn't have relation
		// relationTableName doesn't exist
		// then there are no relations
		if (!(relationTableName in tables)) {
			return [];
		}

		const table = tables[relationTableName];
		const columns = Object.keys(getTableColumns(table));

		let conditions;
		if (locale && 'locale' in columns) {
			conditions = [
				eq(table.parentId, parentId),
				or(eq(table.locale, locale), isNull(table.locale))
			];
		} else {
			conditions = [eq(table.parentId, parentId)];
		}

		const all = await db
			.select()
			.from(table)
			.where(and(...conditions));

		return all as Relation[];
	};

	return {
		create,
		update,
		delete: deleteRelations,
		deleteFromPaths,
		getAll
	};
};

export default createAdapterRelationsInterface;

export type Relation = {
	id?: string;
	parentId: string;
	path: string;
	position: number;
	relationTo: string;
	relationId: string;
	locale?: string;
	livePreview?: GenericDoc;
};

export type BeforeOperationRelation = Omit<Relation, 'parentId'> & { parentId?: string };

type DeleteFromPaths = (args: {
	parentSlug: PrototypeSlug;
	parentId: string;
	paths: string[];
	locale?: string;
}) => Promise<boolean>;

type Delete = (args: { parentSlug: PrototypeSlug; relations: Relation[] }) => Promise<boolean>;
type Update = (args: { parentSlug: PrototypeSlug; relations: Relation[] }) => Promise<boolean>;
type Create = (args: {
	parentSlug: PrototypeSlug;
	parentId: string;
	relations: BeforeOperationRelation[];
}) => Promise<boolean>;

type GetAllRelations = (args: {
	parentSlug: PrototypeSlug;
	parentId: string;
	locale?: string;
}) => Promise<Relation[]>;
