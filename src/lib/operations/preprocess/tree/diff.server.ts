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

		// Compare all relevant properties
		return (
			existing.path !== newBlock.path ||
			existing.position !== newBlock.position ||
			existing.label !== newBlock.label ||
			JSON.stringify(existing.link) !== JSON.stringify(newBlock.link) ||
			existing.parentId !== newBlock.parentId
		);
	});

	return { toAdd, toDelete, toUpdate };
}
