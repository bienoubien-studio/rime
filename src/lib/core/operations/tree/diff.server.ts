import { RizomError } from '$lib/core/errors';
import type { TreeBlock } from '$lib/core/types/doc';
import { isObjectLiteral, omitId } from '$lib/util/object';
import type { WithRequired } from '$lib/util/types';
import type { OperationContext } from '../hooks';

export type TreeBlocksDiff = {
	toAdd: WithRequired<TreeBlock, 'path'>[];
	toDelete: WithRequired<TreeBlock, 'path'>[];
	toUpdate: WithRequired<TreeBlock, 'path'>[];
};

type DefineTreeBlocksDiffArgs = {
	existingBlocks: WithRequired<TreeBlock, 'path'>[];
	incomingBlocks: WithRequired<TreeBlock, 'path'>[];
	context: OperationContext;
};

export function defineTreeBlocksDiff({
	existingBlocks,
	incomingBlocks,
	context
}: DefineTreeBlocksDiffArgs): TreeBlocksDiff {
	const configMap = context.configMap;
	if (!configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing configMap @defineBlocksDiff');

	incomingBlocks = incomingBlocks.map((block) => {
		if (context.isFallbackLocale && block.path) {
			const isLocalized: boolean = configMap[block.path]?.localized || false;
			if (isLocalized) {
				block = omitId(block);
				block.locale = context.isFallbackLocale;
			}
		}
		return block;
	});

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
		// Skip block that doesn't exists
		const existing = existingBlocks.find((e) => e.id === newBlock.id);
		if (!existing) return false;

		// Compare
		for (const [key, val] of Object.entries(existing)) {
			// array of string, ex: select field
			if (Array.isArray(val) && val.length && typeof val[0] === 'string') {
				for (const [index, item] of val.entries()) {
					if (!newBlock[key] || item !== newBlock[key][index]) {
						return true;
					}
				}
			} else if (isObjectLiteral(val)) {
				if (newBlock[key] && JSON.stringify(val) !== JSON.stringify(newBlock[key])) {
					return true;
				}
			} else if (val !== newBlock[key]) {
				// if the value differs from original than it should update
				return true;
			}
		}
		return false;
	});

	return { toAdd, toDelete, toUpdate };
}
