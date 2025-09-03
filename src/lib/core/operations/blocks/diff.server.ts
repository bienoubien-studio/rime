import { RizomError } from '$lib/core/errors';
import type { GenericBlock } from '$lib/core/types/doc.js';
import { omitId } from '$lib/util/object';
import type { OperationContext } from '../hooks';

type BlocksDiff = {
	toAdd: GenericBlock[];
	toDelete: GenericBlock[];
	toUpdate: GenericBlock[];
};

type DefineBlocksDiffArgs = {
	existingBlocks: GenericBlock[];
	incomingBlocks: (Omit<GenericBlock, 'id'> & { id?: string })[];
	context: OperationContext;
};

// If block is localized should not keep its id so it created a new one
// If block is not localized than it should keep its id so block is updated

export function defineBlocksDiff({ existingBlocks, incomingBlocks, context }: DefineBlocksDiffArgs): BlocksDiff {
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

		const existing = existingBlocks.find((e) => e.id === newBlock.id);
		if (!existing) return false;

		const normalizeForComparison = (block: GenericBlock) => {
			return Object.entries(block).reduce((acc, [key, value]) => {
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
