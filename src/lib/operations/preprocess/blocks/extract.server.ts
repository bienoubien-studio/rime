import type { GenericBlock } from 'rizom/types/doc';
import type { FieldProviderServer } from '../fields/provider.server';

type ExtractBlocksArgs = {
	fieldProvider: FieldProviderServer;
};

export function extractBlocks({ fieldProvider }: ExtractBlocksArgs) {
	const blocks: GenericBlock[] = [];

	Object.entries(fieldProvider.configMap).forEach(([path, config]) => {
		if (config.type === 'blocks') {
			const field = fieldProvider.useFieldServer(path);

			const isEmptyValue = config.isEmpty(field.value);

			if (!isEmptyValue) {
				field.value.forEach((block: Partial<GenericBlock>, index: number) => {
					if (block.type) {
						const cleanBlock = {
							...block,
							path: block.path || path,
							position: block.position ?? index
						};

						// Remove children blocks
						const finalBlock = Object.entries(cleanBlock).reduce((acc, [key, value]) => {
							const nestedPath = `${path}.${index}.${key}`;
							if (fieldProvider.configMap[nestedPath]?.type === 'blocks') {
								return acc;
							}
							// @TODO should maybe remove tree also
							return { ...acc, [key]: value };
						}, {} as GenericBlock);

						blocks.push(finalBlock);
					}
				});
			}
		}
	});

	return blocks;
}
