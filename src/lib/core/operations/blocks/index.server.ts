import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { GenericBlock } from '$lib/core/types/doc.js';
import type { Dic } from '$lib/util/types.js';
import { makeVersionsSlug } from '../../../util/schema.js';
import type { OperationContext } from '../hooks/index.js';
import { defineBlocksDiff } from './diff.server.js';
import { extractBlocks } from './extract.server.js';

export const saveBlocks = async (args: {
	context: OperationContext;
	ownerId: string;
	data: Dic;
	incomingPaths: string[];
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
}) => {
	//
	const { context, ownerId, data, incomingPaths, adapter, config } = args;
	const { locale } = context.params;
	const { originalDoc: original, configMap, originalConfigMap } = context;

	if (!configMap || !ownerId) throw new RizomError(RizomError.OPERATION_ERROR, '@saveBlocks');

	const parentTable = config.versions ? makeVersionsSlug(config.slug) : config.slug;

	const incomingBlocks = extractBlocks({
		data,
		configMap
	});

	let existingBlocks: GenericBlock[] = [];

	if (original) {
		if (!originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing original');
		const blocks = extractBlocks({
			data: original,
			configMap: originalConfigMap
		});

		// filter path that are not present in incoming data
		// in order to not delete unmodified blocks fields
		existingBlocks = blocks.filter((block) => {
			return incomingPaths.some((path) => block.path?.startsWith(path));
		});
	}

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		incomingBlocks,
		context
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: parentTable, block })));
	}

	if (blocksDiff.toAdd.length) {
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				adapter.blocks.create({
					parentSlug: parentTable,
					ownerId,
					block,
					locale
				})
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) => adapter.blocks.update({ parentSlug: parentTable, block, locale: locale }))
		);
	}

	console.log(blocksDiff);
	return blocksDiff;
};
