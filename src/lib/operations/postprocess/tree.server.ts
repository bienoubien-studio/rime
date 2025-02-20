import { RizomError } from 'rizom/errors';
import type { TreeBlock } from 'rizom/types/doc';
import type { WithRequired } from 'rizom/types/utility';

export function expandTreePath(simplifiedPath: string): string {
	const parts = simplifiedPath.split('.');
	if (parts.length === 1) return simplifiedPath;

	return parts.reduce((path, part, index) => {
		if (index === 0) return part;
		return `${path}.${part}._children`;
	}, '');
}

export function extractFieldName(path: string): string {
	if (!path) {
		throw new RizomError(RizomError.UNKWONW, 'bad path');
	}
	// Use regex to find the last word segment that's not followed by numbers
	const match = path.match(/[^.0-9]+(?=[.0-9]*$)/);

	if (!match) {
		throw new RizomError(RizomError.UNKWONW, 'bad path');
	}

	return match[0];
}

// REBUILD NESTED STRUCTURE FROM FLAT TreeBlocks FROM DB
//
type TreeMap = Record<string, WithRequired<TreeBlock, 'path'>[]>;

function extractRelevantPath(fullPath: string): string {
	// Find the last word segment (letters only)
	const match = fullPath.match(/[a-zA-Z]+(\.\d+)*$/);
	return match ? match[0] : fullPath;
}

export function rebuildTreeStructure(blocks: WithRequired<TreeBlock, 'path'>[]): TreeMap {
	console.log('before', blocks);
	// Sort blocks by path
	const sortedBlocks = [...blocks].sort((a, b) => a.path.localeCompare(b.path));
	const result: TreeMap = {};

	// Group by root paths
	sortedBlocks.forEach((block) => {
		const pathParts = block.path.split('.');
		const pathSegments = pathParts.length;

		// For root items
		if (pathSegments === 1) {
			if (!result[block.path]) {
				result[block.path] = [];
			}
			result[block.path].push({ ...block, _children: [] });
			return;
		}

		// For nested items
		const parentPath = pathParts.slice(0, -1).join('.');
		const currentIndex = Number(pathParts[pathParts.length - 1]);

		// Find parent array
		let parentArray = result[parentPath];
		if (!parentArray) {
			result[parentPath] = [];
			parentArray = result[parentPath];
		}

		// Find parent item
		const parentItem = parentArray[currentIndex];
		if (!parentItem._children) {
			parentItem._children = [];
		}

		parentItem._children.push({ ...block, _children: [] });
	});
	console.log('result', JSON.stringify(result));
	return result;
}
