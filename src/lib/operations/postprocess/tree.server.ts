import { RizomError } from 'rizom/errors';

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
