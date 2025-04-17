import { extractRelations } from './extract.server.js';
import { defineRelationsDiff } from './diff.server.js';
import type { ConfigMap } from '../configMap/types.js';
import type { Adapter } from '$lib/sqlite/index.server.js';
import type { CompiledArea, CompiledCollection } from '$lib/types/config.js';
import type { GenericBlock } from '$lib/types/doc.js';
import type { Dic } from '$lib/types/util';
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
	ownerId: string;
}) => {
	const {
		configMap,
		incomingPaths,
		blocksDiff,
		treeDiff,
		adapter,
		locale,
		config,
		ownerId,
		data
	} = args;

	/** Delete relations from deletedBlocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		ownerId,
		paths: blocksDiff.toDelete.map((block) => `${block.path}.${block.position}`),
		locale
	});

	/** Delete relations from deletedTreeItems */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		ownerId,
		paths: treeDiff.toDelete.map((block) => `${block.path}.${block.position}`),
		locale
	});

	/** Get relations in data */
	const incomingRelations = extractRelations({
		ownerId,
		data,
		configMap,
		locale
	});

	// get existing relations filtered by path
	// if not present in incoming paths don't keep it.
	const existingRelations = await adapter.relations
		.getAll({
			parentSlug: config.slug,
			ownerId,
			locale: locale
		})
		.then((relations) => {
			// Filter existing relations
			return relations.filter((relation) => {
				return incomingPaths.some((path) => relation.path?.startsWith(path));
			});
		});

	/** get difference between them */
	const relationsDiff = defineRelationsDiff({
		existingRelations,
		incomingRelations,
		locale: locale
	});

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
			ownerId,
			relations: relationsDiff.toAdd
		});
	}

	return relationsDiff;
};
