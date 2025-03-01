import { extractRelations } from './extract.server';
import { defineRelationsDiff } from './diff.server';
import type { ConfigMap } from '../configMap/types';
import type { Adapter, CompiledArea, CompiledCollection, GenericBlock } from 'rizom/types';

import type { Dic } from 'rizom/types/utility';
import type { TreeBlocksDiff } from '../tree/diff.server';

type Diff<T> = { toAdd: T[]; toDelete: T[]; toUpdate: T[] };
export const saveRelations = async (args: {
	data: Dic;
	configMap: ConfigMap;
	blocksDiff: Diff<GenericBlock>;
	treeDiff: TreeBlocksDiff;
	adapter: Adapter;
	locale?: string;
	config: CompiledArea | CompiledCollection;
	parentId: string;
}) => {
	const { configMap, blocksDiff, treeDiff, adapter, locale, config, parentId, data } = args;

	/** Delete relations from deletedBlocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Delete relations from deletedTreeItems */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`)
	});

	/** Get relations in data */
	const incomingRelations = extractRelations({
		parentId,
		data,
		configMap,
		locale
	});

	console.log('incomingRelations', incomingRelations);

	const incomingRelationsPaths = [
		...incomingRelations.emptyPaths,
		...incomingRelations.relations.map((rel) => rel.path)
	];
	/** Get existing relations */
	const existingRelations = await adapter.relations
		.getAll({
			parentSlug: config.slug,
			parentId,
			locale: locale
		})
		.then((relations) =>
			relations.filter((relation) => {
				return incomingRelationsPaths.includes(relation.path);
			})
		);

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		incomingRelations,
		locale: locale
	});

	console.log('existingRelations', existingRelations);
	if (relationsDiff.toDelete.length) {
		await adapter.relations.delete({
			parentSlug: config.slug,
			relations: relationsDiff.toDelete
		});
	}

	if (relationsDiff.toUpdate.length) {
		await adapter.relations.update({
			parentSlug: config.slug,
			relations: relationsDiff.toUpdate
		});
	}

	if (relationsDiff.toAdd.length) {
		await adapter.relations.create({
			parentSlug: config.slug,
			parentId,
			relations: relationsDiff.toAdd
		});
	}

	return relationsDiff;
};
