import { and, eq, inArray, type SQLWrapper } from 'drizzle-orm';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter';

import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility';

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

	const updateOrCreate: UpdateRelations = async ({ parentSlug, parentId, relations }) => {
		const relationTableName = `${parentSlug}Rels`;
		const table = tables[relationTableName];
		for (const relation of relations) {
			//
			const relationToIdKey = `${relation.relationTo}Id`;
			const existing = await db
				.select({ id: table.id })
				.from(table)
				.where(eq(table.id, relation.id));

			if (existing.length) {
				/** Update or delete */
				await db
					.update(table)
					.set({
						position: relation.position,
						path: relation.path,
						[relationToIdKey]: relation.relationId
					})
					.where(eq(table.id, relation.id));
			} else {
				if (relation.relationId !== '' && relation.relationId) {
					const values: Dic = {
						path: relation.path,
						position: relation.position,
						[relationToIdKey]: relation.relationId,
						parentId
					};
					if (relation.locale) {
						values.locale = relation.locale;
					}
					await db.insert(table).values(values);
				}
			}
		}
		return true;
	};

	return {
		updateOrCreate,
		deleteFromPaths
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

type UpdateRelations = (args: {
	parentSlug: PrototypeSlug;
	parentId: string;
	relations: Partial<Relation>[];
}) => Promise<boolean>;

type DeleteFromPaths = (args: {
	parentSlug: PrototypeSlug;
	parentId: string;
	paths: string[];
	locale?: string;
}) => Promise<boolean>;
