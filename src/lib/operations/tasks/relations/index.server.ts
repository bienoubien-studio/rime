import { extractRelations } from './extract.server';
import { defineRelationsDiff } from './diff.server';
import type { ConfigMap } from '../configMap/types';
import type { Adapter, CompiledArea, CompiledCollection, GenericBlock } from 'rizom/types';

import type { Dic } from 'rizom/types/util';
import type { TreeBlocksDiff } from '../tree/diff.server';

type Diff<T> = { toAdd: T[]; toDelete: T[]; toUpdate: T[] };
export const saveRelations = async (args: {
	data: Dic;
	configMap: ConfigMap;
	incomingPaths: string[];
	blocksDiff: Diff<GenericBlock>;
	treeDiff: TreeBlocksDiff;
	adapter: Adapter;
	locale?: string;
	config: CompiledArea | CompiledCollection;
	parentId: string;
}) => {
	const {
		configMap,
		incomingPaths,
		blocksDiff,
		treeDiff,
		adapter,
		locale,
		config,
		parentId,
		data
	} = args;

	// console.log('RELATIONS ===========================================');

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

	// console.log('incomingRelations', incomingRelations);

	// get existing relations filtered by path
	// if not present in incoming paths don't keep it.
	const existingRelations = await adapter.relations
		.getAll({
			parentSlug: config.slug,
			parentId,
			locale: locale
		})
		.then((relations) => {
			// console.log('existingRelations before filter', relations);
			// Filter existing relations
			return relations.filter((relation) => {
				return incomingPaths.some((path) => relation.path?.startsWith(path));
			});
		});

	// console.log('existingRelations', existingRelations);

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		incomingRelations,
		locale: locale
	});

	// console.log('relationsDiff', relationsDiff);

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

	// throw new Error('error');

	if (relationsDiff.toAdd.length) {
		await adapter.relations.create({
			parentSlug: config.slug,
			parentId,
			relations: relationsDiff.toAdd
		});
	}

	return relationsDiff;
};
