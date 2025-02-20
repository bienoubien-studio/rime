import type { Field } from 'rizom/types';
import type { ConfigMap } from './map';
import { isFormField } from 'rizom/utils/field';
import type { TreeFieldRaw } from 'rizom/fields/tree';

export function buildTreeFieldsMap(
	treeConfig: TreeFieldRaw,
	treeItems: any[],
	basePath: string
): ConfigMap {
	let treeMap: ConfigMap = {};

	// Helper to add field configs for a specific path
	const addFieldConfigs = (path: string) => {
		for (const field of treeConfig.fields) {
			if (isFormField(field)) {
				treeMap[`${path}.${field.name}`] = field;
			}
		}
	};

	// Process each item in the tree
	const processItem = (item: any, itemPath: string) => {
		// Add configs for current item
		addFieldConfigs(itemPath);

		// If item has children, process them
		if (item._children && Array.isArray(item._children)) {
			item._children.forEach((child: any, childIndex: number) => {
				const childPath = `${itemPath}._children.${childIndex}`;
				processItem(child, childPath);
			});
		}
	};

	// Process each root level item
	treeItems.forEach((item, index) => {
		const itemPath = `${basePath}.${index}`;
		processItem(item, itemPath);
	});

	return treeMap;
}
