import type { TreeBlock } from 'rizom/types/doc';
import type { WithRequired } from 'rizom/types/utility';

type TreeBlocksDiff = {
	toAdd: WithRequired<TreeBlock, 'path'>[];
	toDelete: WithRequired<TreeBlock, 'path'>[];
	toUpdate: WithRequired<TreeBlock, 'path'>[];
};

type DefineTreeBlocksDiffArgs = {
	existingBlocks: WithRequired<TreeBlock, 'path'>[];
	incomingBlocks: WithRequired<TreeBlock, 'path'>[];
};

export function defineTreeBlocksDiff({
	existingBlocks,
	incomingBlocks
}: DefineTreeBlocksDiffArgs): TreeBlocksDiff {
	// Consider blocks as new if they have temp ID OR no ID at all
	const toAdd = incomingBlocks.filter((block) => !block.id || block.id.startsWith('temp-'));

	const toDelete = existingBlocks.filter((existing) => {
		return !incomingBlocks.some((newBlock) => {
			// Only compare blocks that have real IDs
			if (!newBlock.id || newBlock.id.startsWith('temp-')) return false;
			return newBlock.id === existing.id;
		});
	});

	const toUpdate = incomingBlocks.filter((newBlock) => {
		// Skip blocks without IDs or with temp IDs
		if (!newBlock.id || newBlock.id.startsWith('temp-')) return false;

		const existing = existingBlocks.find((e) => e.id === newBlock.id);
		if (!existing) return false;

		// Position change should trigger an update
		if (existing.position !== newBlock.position) {
			return true;
		}

		const normalizeForComparison = (block: WithRequired<TreeBlock, 'path'>) => {
			const { id, parentId, path, position, _children, ...rest } = block;
			return Object.entries(rest).reduce((acc, [key, value]) => {
				if (Array.isArray(value) && value[0]?.type) {
					return acc;
				}
				return { ...acc, [key]: value };
			}, {});
		};

		const normalizedExisting = normalizeForComparison(existing);
		const normalizedNew = normalizeForComparison(newBlock);

		return JSON.stringify(normalizedExisting) !== JSON.stringify(normalizedNew);
	});

	return { toAdd, toDelete, toUpdate };
}
