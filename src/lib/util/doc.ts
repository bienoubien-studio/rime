import type { GenericDoc } from 'rizom/types/doc.js';
import type { CompiledCollection, CompiledArea } from 'rizom/types/config.js';
import type { Link } from '../fields/link/types.js';
import type { Dic } from 'rizom/types/util.js';
import { isUploadConfig } from 'rizom/util/config.js';

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
				const emptyLink: Link = { value: '', target: '_self', type: 'url' };
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
