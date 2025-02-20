import type { TreeBlock } from 'rizom/types/doc';
import type { ConfigMap } from '../config/map';
import { getValueFromPath } from '$lib/utils/doc';

type ExtractTreesArgs = {
	doc: any;
	configMap: ConfigMap;
};

function processTreeItem(
	item: TreeBlock,
	path: string,
	parentRelativePath?: string,
	items: TreeBlock[] = []
) {
	const relativePath = parentRelativePath
		? `${parentRelativePath}.${item.relativePath}`
		: item.relativePath;

	// Create clean item without _children
	const { _children, ...cleanItem } = {
		...item,
		path: item.path || path,
		relativePath
	};

	items.push(cleanItem);

	// Process children if they exist
	if (_children?.length) {
		_children.forEach((child, index) => {
			processTreeItem(
				{
					...child,
					relativePath: child.relativePath ?? index.toString()
				},
				path,
				relativePath,
				items
			);
		});
	}

	return items;
}

export function extractTreeItems({ doc, configMap }: ExtractTreesArgs) {
	const items: TreeBlock[] = [];

	if (!doc || !configMap) return items;

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'tree') {
			const value = getValueFromPath(doc, path) as TreeBlock[];
			const isEmptyValue = config.isEmpty(value);

			if (!isEmptyValue) {
				value.forEach((item, index) => {
					processTreeItem(
						{
							...item,
							relativePath: item.relativePath ?? index.toString()
						},
						path,
						undefined,
						items
					);
				});
			}
		}
	});

	return items;
}
