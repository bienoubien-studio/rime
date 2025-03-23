import type { GenericDoc, UploadDoc } from 'rizom/types/doc.js';
import type { CompiledCollection, CompiledArea } from 'rizom/types/config.js';
import type { Link } from 'rizom';
import type { Dic } from 'rizom/types/util.js';
import { isUploadConfig } from 'rizom/util/config.js';

export function stringRepresentation(obj: any, indent = 0): string {
	let result = '';

	// Handle richtext pattern
	if (obj?.type === 'doc' && Array.isArray(obj?.content)) {
		return '';
	}

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj
			.map((item) => stringRepresentation(item, indent))
			.filter(Boolean)
			.join('\n');
	}

	// Handle objects
	if (obj && typeof obj === 'object') {
		// If object has a path property, use it (with position if available)
		if ('path' in obj) {
			const position = 'position' in obj ? `.${obj.position}` : '';
			result += ' '.repeat(indent) + obj.path + position;

			// Show content fields
			if (obj.title) {
				result += '\n' + ' '.repeat(indent + 2) + 'title';
			}
			if (obj.description) {
				result += '\n' + ' '.repeat(indent + 2) + 'description';
			}

			// Process children of this object
			const childrenResult = Object.entries(obj)
				.filter(
					([key, value]) =>
						value && typeof value === 'object' && !['title', 'description'].includes(key)
				)
				.map(([_, value]) => stringRepresentation(value, indent + 2))
				.filter(Boolean)
				.join('\n');

			if (childrenResult) {
				result += '\n' + childrenResult;
			}
		} else {
			// Process regular object properties
			const entries = Object.entries(obj)
				.filter(([_, value]) => value !== null)
				.filter(([key]) => !['path', 'position'].includes(key));

			result += entries
				.map(([key, value]) => {
					if (typeof value === 'object') {
						const subTree = stringRepresentation(value, indent + 2);
						return ' '.repeat(indent) + key + (subTree ? '\n' + subTree : '');
					}
					return ' '.repeat(indent) + key;
				})
				.filter(Boolean)
				.join('\n');
		}
	}

	return result;
}

export const isUploadDoc = (doc: GenericDoc): doc is UploadDoc => {
	return 'mimeType' in doc;
};

export const createBlankDocument = <T extends GenericDoc = GenericDoc>(
	config: CompiledCollection | CompiledArea
): T => {
	function reduceFieldsToBlankDocument(prev: Dic, curr: any) {
		try {
			if (curr.type === 'tabs') {
				curr.tabs.forEach((tab: any) => {
					prev[tab.name] = tab.fields.reduce(reduceFieldsToBlankDocument, {});
				});
			} else if (curr.type === 'group') {
				prev[curr.name] = curr.fields.reduce(reduceFieldsToBlankDocument, {});
			} else if (curr.type === 'link') {
				const emptyLink: Link = { link: '', target: '_self', type: 'url' };
				prev[curr.name] = emptyLink;
			} else if (['blocks', 'relation', 'select', 'tree'].includes(curr.type)) {
				prev[curr.name] = [];
			} else if ('fields' in curr) {
				prev[curr.name] = curr.fields.reduce(reduceFieldsToBlankDocument, {});
			} else {
				prev[curr.name] = null;
			}
		} catch (err) {
			console.error(curr);
			throw err;
		}
		return prev;
	}

	const fields: GenericDoc['fields'] = config.fields.reduce(reduceFieldsToBlankDocument, {});
	const empty = {
		...fields,
		_type: config.slug,
		_prototype: config.type
	};

	if (
		config.type === 'collection' &&
		isUploadConfig(config) &&
		'imageSizes' in config &&
		config.imageSizes
	) {
		empty.sizes = {};
	}

	return empty as T;
};
