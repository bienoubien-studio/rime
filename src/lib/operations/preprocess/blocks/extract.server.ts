import type { GenericBlock } from 'rizom/types/doc';
import type { ConfigMap } from '../config/map';
import { getValueAtPath } from '$lib/utils/doc';

type ExtractBlocksArgs = {
	doc: any;
	configMap: ConfigMap;
};

export function extractBlocks({ doc, configMap }: ExtractBlocksArgs) {
	const blocks: GenericBlock[] = [];

	if (!doc || !configMap) return blocks;

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'blocks') {
			const value = getValueAtPath(doc, path) as GenericBlock[];

			const isEmptyValue = config.isEmpty(value);
			if (!isEmptyValue) {
				value.forEach((block, index) => {
					if (block.type) {
						const cleanBlock = {
							...block,
							path: block.path || path,
							position: block.position ?? index
						};

						// Type-safe way to remove nested blocks
						const finalBlock = Object.entries(cleanBlock).reduce((acc, [key, value]) => {
							const nestedPath = `${path}.${index}.${key}`;
							if (configMap[nestedPath]?.type === 'blocks') {
								return acc;
							}
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
