import type { AugmentCollectionFn } from './types.js';
import { text } from '$lib/fields/text/index.server.js';
import { number } from '$lib/fields/number/index.js';
import type { Collection } from '../../../types.js';

/**
 * Add root table fields _parent and _position
 * for nested collection
 */
export const augmentNested = <T extends { nested?: boolean; fields: Collection<any>['fields'] }>(config: T): T => {
	let fields = [...config.fields];
	
	if (config.nested) {
		const _parentField = text('_parent').hidden()._root();
		// @TODO For now overwrite the toSchema method, it is ugly but it works
		// Later maybe add a field specific method to set a schema output
		_parentField.toSchema = () => `_parent: text('_parent').references((): any => pages.id, {onDelete: 'set null'})`;
		fields.push(_parentField);
		fields.push(number('_position').defaultValue(0).hidden()._root());
	}

	return { ...config, fields };
};
