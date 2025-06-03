import { extractBlocks } from './extract.server.js';
import { defineBlocksDiff } from './diff.server.js';
import type { Dic } from '$lib/util/types.js';
import type { ConfigMap } from '../configMap/types.js';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericBlock } from '$lib/core/types/doc.js';
import { makeVersionsSlug } from '../../../util/schema.js';

export const saveBlocks = async (args: {
	configMap: ConfigMap;
	data: Dic;
	incomingPaths: string[];
	original?: Dic;
	originalConfigMap?: ConfigMap;
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
	ownerId: string;
	locale?: string;
}) => {
	const {
		data,
		configMap,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		ownerId,
		locale
	} = args;

	const parentTable = config.versions ? makeVersionsSlug(config.slug) : config.slug
	
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
		incomingBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: parentTable, block }))
		);
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
			blocksDiff.toUpdate.map((block) =>
				adapter.blocks.update({ parentSlug: parentTable, block, locale: locale })
			)
		);
	}

	return blocksDiff;
};
