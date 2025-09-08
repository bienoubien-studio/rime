import type { GenericDoc } from '$lib/core/types/doc.js';
import type { Field } from '$lib/fields/types.js';
import { isBlocksFieldRaw, isFormField, isGroupFieldRaw, isTabsFieldRaw, isTreeFieldRaw } from '$lib/util/field.js';
import type { DeepPartial, Dic } from '$lib/util/types.js';
import { buildTreeFieldsMap } from './buildTreeMap.js';
import type { ConfigMap } from './types.js';

export const buildConfigMap = (data: DeepPartial<GenericDoc>, incomingFields: Field[]) => {
	let map: ConfigMap = {};

	const traverseData = (data: Dic | undefined, fields: Field[], basePath: string) => {
		if (!data) return;

		basePath = basePath === '' ? basePath : `${basePath}.`;

		for (const field of fields) {
			if (isTabsFieldRaw(field)) {
				for (const tab of field.tabs) {
					if (tab.name in data) {
						traverseData(data[tab.name], tab.fields, tab.name);
					}
				}
				continue;
			}

			if (!isFormField(field)) continue;
			if (!(field.name in data)) continue;

			const value = data[field.name];
			const path = `${basePath}${field.name}`;

			map[path] = field;

			if (isBlocksFieldRaw(field) && value && Array.isArray(value)) {
				const blocks = value;
				for (const [index, block] of blocks.entries()) {
					try {
						const blockConfig = field.blocks.find((b) => b.name === block.type);
						if (blockConfig) {
							traverseData(block, blockConfig.fields, `${path}.${index}`);
						}
					} catch (err: any) {
						console.warn(
							`block at path ${path} and postition ${index} not found but there are some residual data owned by this block`
						);
					}
				}
			} else if (isTreeFieldRaw(field) && value && Array.isArray(value)) {
				const treeMap = buildTreeFieldsMap(field, value, path);
				map = { ...map, ...treeMap };
			} else if (isGroupFieldRaw(field)) {
				traverseData(value, field.fields, path);
			}
		}
	};

	traverseData(data, incomingFields, '');
	return map;
};
