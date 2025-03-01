import { extractBlocks } from './extract.server';
import type { Adapter, CompiledArea, CompiledCollection, GenericBlock } from 'rizom/types';
import { defineBlocksDiff } from './diff.server';
import type { Dic } from 'rizom/types/utility';
import type { ConfigMap } from '../config-map/types';

export const saveBlocks = async (args: {
	configMap: ConfigMap;
	data: Dic;
	original?: Dic;
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
	parentId: string;
	locale?: string;
}) => {
	const { data, configMap, original, adapter, config, parentId, locale } = args;

	const incomingBlocks = extractBlocks({
		data,
		configMap
	});

	const incomingBlocksPaths = incomingBlocks.map((block) => block.path);
	let existingBlocks: GenericBlock[] = [];

	if (original)
		existingBlocks = extractBlocks({
			data: original,
			configMap
		}).filter((block) => {
			return incomingBlocksPaths.includes(block.path);
		});

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		incomingBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: config.slug, block }))
		);
	}

	if (blocksDiff.toAdd.length) {
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				adapter.blocks.create({
					parentSlug: config.slug,
					parentId,
					block,
					locale
				})
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) =>
				adapter.blocks.update({ parentSlug: config.slug, block, locale: locale })
			)
		);
	}

	return blocksDiff;
};
