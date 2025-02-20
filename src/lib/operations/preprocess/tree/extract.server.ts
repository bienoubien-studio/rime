import type { TreeBlock } from 'rizom/types/doc';
import type { ConfigMap } from '../config/map';
import { getValueFromPath } from '$lib/utils/doc';
import cloneDeep from 'clone-deep';
import type { WithRequired } from 'rizom/types/utility';

type ExtractTreesArgs = {
	doc: any;
	configMap: ConfigMap;
};

export function extractTreeItems({ doc, configMap }: ExtractTreesArgs) {
	const items: WithRequired<TreeBlock, 'path'>[] = [];

	if (!doc || !configMap) return items;

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
			? `${parentPath}` // For nested items, use parent path
			: rootPath; // For root items, use root path

		// Remove children prop as the will be
		processedItem._children = [];

		// Add the processed item to the flat array
		items.push(processedItem as WithRequired<TreeBlock, 'path'>);

		// Process children recursively
		(item._children || []).forEach((child, childIndex) => {
			processTreeItem(
				child,
				childIndex,
				rootPath,
				`${processedItem.path}.${processedItem.position}` // Create new parent path based on current item's position
			);
		});
	}

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'tree') {
			const value = getValueFromPath(doc, path) as TreeBlock[];
			const isEmptyValue = config.isEmpty(value);

			if (!isEmptyValue) {
				value.forEach((item, index) => {
					processTreeItem(item, index, path, undefined);
				});
			}
		}
	});

	return items;
}
