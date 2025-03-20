import type { TreeBlock } from 'rizom/types/doc';
import cloneDeep from 'clone-deep';
import type { Dic, WithRequired } from 'rizom/types/util';
import type { ConfigMap } from '../configMap/types';
import { getValueAtPath } from 'rizom/util/object';

type ExtractTreesArgs = {
	data: Dic;
	configMap: ConfigMap;
};

export function extractTreeBlocks({ data, configMap }: ExtractTreesArgs) {
	const blocks: WithRequired<TreeBlock, 'path'>[] = [];

	function processTreeItem(
		item: TreeBlock,
		index: number,
		rootPath: string,
		parentPath?: string
	): void {
		// Create a copy of the item to avoid modifying the original
		const processedItem: TreeBlock = cloneDeep({ ...item });

		// Set position if not defined
		if (typeof processedItem.position !== 'number') {
			processedItem.position = index;
		}

		// Set path based on whether it's a root level or nested item
		processedItem.path = parentPath
			? `${parentPath}` // For nested blocks, use parent path
			: rootPath; // For root blocks, use root path

		// Remove children prop as they will be extracted
		processedItem._children = [];

		// Add the processed item to the flat array
		blocks.push(processedItem as WithRequired<TreeBlock, 'path'>);

		// Process children recursively
		(item._children || []).forEach((child, childIndex) => {
			processTreeItem(
				child,
				childIndex,
				rootPath,
				`${processedItem.path}.${processedItem.position}._children` // Create new parent path based on current item's position
			);
		});
	}

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'tree') {
			const value = getValueAtPath<TreeBlock[]>(path, data);

			const isEmptyValue = config.isEmpty(value);

			if (value && !isEmptyValue) {
				value.forEach((item: TreeBlock, index: number) => {
					processTreeItem(item, index, path, undefined);
				});
			}
		}
	});

	return blocks;
}
