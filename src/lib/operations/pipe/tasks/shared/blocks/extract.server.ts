import type { GenericBlock } from 'rizom/types/doc';
import type { ConfigMap } from '../field-resolver/map/types';
import type { FieldResolverServer } from '../field-resolver/index.server';

type ExtractBlocksArgs = {
	resolver: FieldResolverServer;
	configMap: ConfigMap;
};

export function extractBlocks({ resolver, configMap }: ExtractBlocksArgs) {
	const blocks: GenericBlock[] = [];

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'blocks') {
			const field = resolver.useFieldServer(path);

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
							if (configMap[nestedPath]?.type === 'blocks') {
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
