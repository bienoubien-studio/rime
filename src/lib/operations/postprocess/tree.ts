export const extractFieldName = (path: string): [string, string] => {
	console.log('extractFieldName in :', path);
	// Single segment
	if (!path.includes('.')) {
		console.log('--> out (single segment) :', [path, '']);
		return [path, ''];
	}

	// Segment followed by .number._children
	const regexPattern = /([^.]+)\.((?:\d+\._children(?:\.\d+\._children)*)$)/;
	const match = path.match(regexPattern);
	if (match) {
		console.log('--> out (followed by .number._children) :', [match[1], match[2]]);
		return [match[1], match[2]];
	}

	// Last segment (not number or _children)
	const segments = path.split('.');
	const lastSegment = segments[segments.length - 1];
	if (isNaN(Number(lastSegment)) && lastSegment !== '_children') {
		console.log('--> out (Last segment):', [lastSegment, '']);
		return [lastSegment, ''];
	}

	console.log('--> out (why ?):', ['', '']);
	return ['', ''];
};
