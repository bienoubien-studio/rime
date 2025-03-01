import type { TreeBlock } from 'rizom/types/doc';
import cloneDeep from 'clone-deep';
import type { WithRequired } from 'rizom/types/utility';
import type { FieldResolverServer } from '../field-resolver/index.server';
import type { ConfigMap } from '../field-resolver/map/types';

type ExtractTreesArgs = {
	resolver: FieldResolverServer;
	configMap: ConfigMap;
};

export function extractTreeBlocks({ resolver, configMap }: ExtractTreesArgs) {
	const items: WithRequired<TreeBlock, 'path'>[] = [];

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

		// Remove children prop as they will be extracted
		processedItem._children = [];

		// Add the processed item to the flat array
		items.push(processedItem as WithRequired<TreeBlock, 'path'>);

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
			const field = resolver.useFieldServer(path);
			const isEmptyValue = config.isEmpty(field.value);
			// console.log('in', toNestedRepresentation(value).toString());
			if (!isEmptyValue) {
				field.value.forEach((item: TreeBlock, index: number) => {
					processTreeItem(item, index, path, undefined);
				});
			}
		}
	});

	// console.log('out', toNestedRepresentation(items).toString());

	return items;
}
