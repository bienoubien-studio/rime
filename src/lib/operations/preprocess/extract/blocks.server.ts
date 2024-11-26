import { getValueFromPath } from '$lib/utils/doc.js';
import { isBlocksField } from '$lib/utils/field.js';
import type { GenericBlock } from 'rizom/types/doc.js';
import type { ConfigMap } from '../config/map.js';

export const extractBlocks = (doc: Dic, configMap: ConfigMap) => {
	const blocks = [];
	const paths = [];

	for (const [path, config] of Object.entries(configMap)) {
		if (isBlocksField(config)) {
			paths.push(path);
			let value = getValueFromPath(doc, path);
			const isNullish = value === '' || !value;
			const hasBlock = !isNullish && Array.isArray(value) && value.length > 0;

			if (hasBlock) {
				value = value.map((block: Partial<GenericBlock>, index: number) => ({
					...block,
					path,
					position: index
				}));
			} else {
				value = [];
			}
			blocks.push(...value);
		}
	}

	return { blocks, paths };
};
