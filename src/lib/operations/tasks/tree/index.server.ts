import { extractTreeBlocks } from './extract.server';
import type { TreeBlock } from 'rizom/types/doc';
import type { Dic, WithRequired } from 'rizom/types/utility';
import { defineTreeBlocksDiff } from './diff.server';
import type { Adapter, CompiledArea, CompiledCollection } from 'rizom/types';
import type { ConfigMap } from '../configMap/types';

export const saveTreeBlocks = async (args: {
	configMap: ConfigMap;
	data: Dic;
	original?: Dic;
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
	parentId: string;
	locale?: string;
}) => {
	const { data, configMap, original, adapter, config, parentId, locale } = args;

	// Get incomings
	const incomingTreeBlocks = extractTreeBlocks({
		data,
		configMap
	});

	const incomingTreeBlocksPaths = incomingTreeBlocks.map((block) => block.path);

	// Get existings
	let existingTreeBlocks: WithRequired<TreeBlock, 'path'>[] = [];
	if (original)
		existingTreeBlocks = extractTreeBlocks({
			data: original,
			configMap: configMap
		}).filter((block) => {
			return incomingTreeBlocksPaths.includes(block.path);
		});

	const treeDiff = defineTreeBlocksDiff({
		existingBlocks: existingTreeBlocks,
		incomingBlocks: incomingTreeBlocks
	});

	if (treeDiff.toDelete.length) {
		await Promise.all(
			treeDiff.toDelete.map((block) => adapter.tree.delete({ parentSlug: config.slug, block }))
		);
	}

	if (treeDiff.toAdd.length) {
		await Promise.all(
			treeDiff.toAdd.map((block) =>
				adapter.tree.create({
					parentSlug: config.slug,
					parentId,
					block,
					locale: locale
				})
			)
		);
	}

	if (treeDiff.toUpdate.length) {
		await Promise.all(
			treeDiff.toUpdate.map((block) =>
				adapter.tree.update({ parentSlug: config.slug, block, locale: locale })
			)
		);
	}

	return treeDiff;
};
