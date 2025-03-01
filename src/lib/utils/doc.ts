import type { GenericDoc, UploadDoc } from 'rizom/types/doc.js';
import { flattenWithGuard, isBuffer, isObjectLiteral } from './object.js';
import type { CompiledCollection, CompiledArea } from 'rizom/types/config.js';
import type { Link } from 'rizom';
import type { Dic } from 'rizom/types/utility.js';
import { isUploadConfig } from 'rizom/config/utils.js';

export const isUploadDoc = (doc: GenericDoc): doc is UploadDoc => {
	return 'mimeType' in doc;
};

export const safeFlattenDoc = (doc: Dic) =>
	flattenWithGuard(doc, {
		shouldFlat: ([, value]) => {
			if (Array.isArray(value) && value.length) {
				/** prevent relation flatting */
				if (value[0].constructor === Object && 'relationTo' in value[0]) return false;
				/** prevent block flating */
				if (value[0].constructor === Object && 'type' in value[0]) return false;
				/** prevent select field flatting */
				if (typeof value[0] === 'string') return false;
			}

			/** prevent richText flatting */
			if (
				value &&
				value.constructor === Object &&
				'type' in value &&
				value.type === 'doc' &&
				'content' in value &&
				Object.keys(value).length === 2
			) {
				return false;
			}
			/** prevent link flatting */
			if (
				value &&
				value.constructor === Object &&
				'type' in value &&
				'link' in value &&
				'target' in value &&
				[3, 4].includes(Object.keys(value).length)
			) {
				return false;
			}
			return true;
		}
	});

export const getValueAtPath = <T extends unknown>(doc: Dic, path: string): T | null | undefined => {
	const parts = path.split('.');
	let current = doc;
	for (const part of parts) {
		if (/^d+$/.test(part)) {
			current = current[parseInt(part)];
		} else {
			current = current[part];
		}
		if (!current) {
			return current;
		}
	}
	return current as T;
};

export const setValueAtPath = <T extends any>(obj: T, path: string, value: unknown): T => {
	const parts = path.split('.');

	let current: any = obj;
	// We iterate until the second-to-last part
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (/^\d+$/.test(part) && Array.isArray(current)) {
			current = current[parseInt(part)];
		} else if (isObjectLiteral(current) && part in current) {
			current = current[part];
		} else {
			throw new Error(`Can't find ${path}`);
		}
		if (!current) {
			throw new Error(`Can't find ${path}`);
		}
	}

	// Handle the last part separately for assignment
	const lastPart = parts[parts.length - 1];
	if (/^\d+$/.test(lastPart) && Array.isArray(current)) {
		current[parseInt(lastPart)] = value;
	} else if (isObjectLiteral(current)) {
		current[lastPart] = value;
	} else {
		throw new Error(`Can't set value at ${path}`);
	}

	return obj;
};

export const getValueFromPath: GetValueFromPath = (doc, path, opts) => {
	opts = opts || {};
	const delimiter = '.';
	const maxDepth = opts.maxDepth;
	let output: any = null;
	function parse(object: Dic, prev?: string, currentDepth?: number) {
		currentDepth = currentDepth || 1;
		Object.keys(object).forEach(function (key) {
			const value = object[key];
			const type = Object.prototype.toString.call(value);
			const isbuffer = isBuffer(value);
			const isobject = type === '[object Object]' || type === '[object Array]';

			const newKey = prev ? prev + delimiter + key : key;

			if (newKey === path) {
				return (output = value);
			}

			if (
				!isbuffer &&
				isobject &&
				Object.keys(value).length &&
				(!maxDepth || currentDepth < maxDepth)
			) {
				return parse(value, newKey, currentDepth + 1);
			}
		});
	}

	parse(doc);

	return output;
};

// @TODO make each field responsible of its empty value somehow
export const createBlankDocument = <T extends GenericDoc = GenericDoc>(
	config: CompiledCollection | CompiledArea
): T => {
	function reduceFieldsToBlankDocument(prev: Dic, curr: any) {
		try {
			if (curr.type === 'tabs') {
				return curr.tabs.reduce(reduceFieldsToBlankDocument, prev);
			} else if (curr.type === 'group') {
				return curr.fields.reduce(reduceFieldsToBlankDocument, prev);
			} else if (curr.type === 'link') {
				const emptyLink: Link = { link: '', target: '_self', type: 'url' };
				prev[curr.name] = emptyLink;
			} else if (['blocks', 'relation', 'select', 'tree'].includes(curr.type)) {
				prev[curr.name] = [];
			} else if ('fields' in curr) {
				return curr.fields.reduce(reduceFieldsToBlankDocument, prev);
			} else {
				prev[curr.name] = null;
			}
		} catch (err) {
			console.log(curr);
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

type GetValueFromPathOptions = {
	maxDepth?: number;
};
type GetValueFromPath = (
	doc: Partial<GenericDoc>,
	path: string,
	opts?: GetValueFromPathOptions
) => any;
