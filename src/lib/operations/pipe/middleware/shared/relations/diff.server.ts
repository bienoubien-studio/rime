import type { BeforeOperationRelation, Relation } from 'rizom/db/relations';

type RelationDiff = {
	toAdd: BeforeOperationRelation[];
	toDelete: Relation[];
	toUpdate: Relation[];
};

type Args = {
	existingRelations: Relation[];
	incomingRelations: { relations: BeforeOperationRelation[]; emptyPaths: string[] };
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

	const { relations: incomingRels, emptyPaths } = incomingRelations;

	// Process incoming relations
	for (const incoming of incomingRels) {
		const existingMatch = existingRelations.find(
			(existing) =>
				(incoming.id && existing.id === incoming.id) ||
				(!incoming.id &&
					existing[`${incoming.relationTo}Id` as keyof typeof existing] === incoming.relationId &&
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

			// Delete if path is in emptyPaths
			if (emptyPaths.includes(existing.path)) {
				return true;
			}

			// Delete if not found in incoming relations
			return !incomingRels.some(
				(incoming) =>
					(incoming.id && existing.id === incoming.id) ||
					(!incoming.id &&
						existing[`${incoming.relationTo}Id` as keyof typeof existing] === incoming.relationId &&
						(incoming.locale ? existing.locale === incoming.locale : existing.locale === null))
			);
		})
	);

	return { toAdd, toDelete, toUpdate };
};
