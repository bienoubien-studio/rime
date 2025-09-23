import { makeVersionsSlug } from '$lib/adapter-sqlite/generate-schema/util.js';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { TreeBlock } from '$lib/core/types/doc';
import type { CompiledArea, CompiledCollection } from '$lib/types';
import type { Dic, WithRequired } from '$lib/util/types';
import type { OperationContext } from '../hooks/index.server.js';
import { defineTreeBlocksDiff } from './diff.server.js';
import { extractTreeBlocks } from './extract.server.js';

export const saveTreeBlocks = async (args: {
	context: OperationContext;
	ownerId: string;
	data: Dic;
	incomingPaths: string[];
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
}) => {
	const { context, ownerId, data, incomingPaths, adapter, config } = args;
	const { locale } = context.params;
	const { originalDoc: original, configMap, originalConfigMap } = context;

	if (!configMap || !ownerId) throw new RizomError(RizomError.OPERATION_ERROR, '@saveBlocks');

	const parentTable = config.versions ? makeVersionsSlug(config.slug) : config.slug;

	// Get incomings
	const incomingTreeBlocks = extractTreeBlocks({
		data,
		configMap
	});

	// Get existings
	let existingTreeBlocks: WithRequired<TreeBlock, 'path'>[] = [];
	if (original) {
		if (!originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing original');
		const blocks = extractTreeBlocks({
			data: original,
			configMap: originalConfigMap
		});

		existingTreeBlocks = blocks.filter((block) => {
			// filter path that are not present in incoming data
			// in order to not delete unmodified blocks fields
			return incomingPaths.some((path) => block.path?.startsWith(path));
		});
	}

	const treeDiff = defineTreeBlocksDiff({
		existingBlocks: existingTreeBlocks,
		incomingBlocks: incomingTreeBlocks,
		context
	});

	if (treeDiff.toDelete.length) {
		await Promise.all(treeDiff.toDelete.map((block) => adapter.tree.delete({ parentSlug: parentTable, block })));
	}

	if (treeDiff.toAdd.length) {
		await Promise.all(
			treeDiff.toAdd.map((block) =>
				adapter.tree.create({
					parentSlug: parentTable,
					ownerId,
					block,
					locale: locale
				})
			)
		);
	}

	if (treeDiff.toUpdate.length) {
		await Promise.all(
			treeDiff.toUpdate.map((block) => adapter.tree.update({ parentSlug: parentTable, block, locale: locale }))
		);
	}

	return treeDiff;
};
