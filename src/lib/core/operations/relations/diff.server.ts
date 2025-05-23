import type { BeforeOperationRelation, Relation } from '$lib/adapter-sqlite/relations.js';

export type RelationDiff = {
	toAdd: BeforeOperationRelation[];
	toDelete: Relation[];
	toUpdate: Relation[];
};

type Args = {
	existingRelations: Relation[];
	incomingRelations: BeforeOperationRelation[];
	locale?: string;
};

export const defineRelationsDiff = ({
	existingRelations,
	incomingRelations,
	locale
}: Args): RelationDiff => {
	const toAdd: BeforeOperationRelation[] = [];
	const toDelete: Relation[] = [];
	const toUpdate: Relation[] = [];
	const processedIds = new Set<string>(); // Keep track of processed IDs

	// Process incoming relations
	for (const incoming of incomingRelations) {
		const existingMatch = existingRelations.find(
			(existing) =>
				(incoming.id && existing.id === incoming.id) ||
				(!incoming.id &&
					existing[`${incoming.relationTo}Id` as keyof typeof existing] === incoming.documentId &&
					(incoming.locale ? existing.locale === incoming.locale : existing.locale === null))
		);

		if (existingMatch) {
			// Only add to toUpdate if we haven't processed this ID yet
			if (!processedIds.has(existingMatch.id!)) {
				toUpdate.push({
					...existingMatch,
					path: incoming.path,
					position: incoming.position
				});
				processedIds.add(existingMatch.id!);
			}
		} else {
			toAdd.push(incoming);
		}
	}

	// Find relations to delete
	toDelete.push(
		...existingRelations.filter((existing) => {
			// Keep relations from other locales
			if (existing.locale && existing.locale !== locale) {
				return false;
			}

			// Delete if not found in incoming relations
			return !incomingRelations.some(
				(incoming) =>
					(incoming.id && existing.id === incoming.id) ||
					(!incoming.id &&
						existing[`${incoming.relationTo}Id` as keyof typeof existing] === incoming.documentId &&
						(incoming.locale ? existing.locale === incoming.locale : existing.locale === null))
			);
		})
	);

	return { toAdd, toDelete, toUpdate };
};
