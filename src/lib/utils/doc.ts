import type { GenericDoc, UploadDoc } from 'rizom/types/doc.js';
import { flattenWithGuard, isBuffer } from './object.js';
import type { CompiledCollectionConfig, CompiledAreaConfig } from 'rizom/types/config.js';
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
				try {
					let foo = value[0].constructor;
				} catch (err) {
					console.log('value on error is ', value);
					throw err;
				}
				/** prevent relation flatting */
				if (value[0].constructor === Object && 'relationTo' in value[0]) return false;
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
				'label' in value &&
				[4, 5].includes(Object.keys(value).length)
			) {
				return false;
			}
			return true;
		}
	});

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

export const createBlankDocument = <T extends GenericDoc = GenericDoc>(
	config: CompiledCollectionConfig | CompiledAreaConfig
): T => {
	function reduceFieldsToBlankDocument(prev: Dic, curr: any) {
		if (curr.type === 'tabs') {
			return curr.tabs.reduce(reduceFieldsToBlankDocument, prev);
		} else if (curr.type === 'group') {
			return curr.fields.reduce(reduceFieldsToBlankDocument, prev);
		} else if (curr.type === 'link') {
			const emptyLink: Link = { label: '', link: '', target: '_self', type: 'url' };
			prev[curr.name] = emptyLink;
		} else if (['blocks', 'relation', 'select'].includes(curr.type)) {
			prev[curr.name] = [];
		} else if ('fields' in curr) {
			return curr.fields.reduce(reduceFieldsToBlankDocument, prev);
		} else {
			prev[curr.name] = null;
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
