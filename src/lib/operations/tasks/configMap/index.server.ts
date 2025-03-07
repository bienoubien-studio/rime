import type { Field } from 'rizom/types/fields.js';
import { isBlocksFieldRaw, isFormField, isTreeFieldRaw, toFormFields } from 'rizom/utils/field.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility.js';
import { buildTreeFieldsMap } from './buildTreeMap.server.js';
import type { ConfigMap } from './types.js';

export const buildConfigMap = (data: Partial<GenericDoc>, incomingFields: Field[]) => {
	let map: ConfigMap = {};

	const formFields = incomingFields.reduce(toFormFields, []);

	const traverseData = (data: Dic, fields: Field[], basePath: string) => {
		basePath = basePath === '' ? basePath : `${basePath}.`;
		for (const [key, value] of Object.entries(data)) {
			const config = fields.filter(isFormField).find((f) => f.name === key);
			const path = `${basePath}${key}`;

			if (config) {
				map = { ...map, [path]: config };
				if (isBlocksFieldRaw(config) && value && Array.isArray(value)) {
					const blocks = value;
					for (const [index, block] of blocks.entries()) {
						const blockConfig = config.blocks.find((b) => b.name === block.type);
						if (blockConfig) {
							traverseData(block, blockConfig.fields, `${basePath}${key}.${index}`);
						}
					}
				} else if (isTreeFieldRaw(config) && value && Array.isArray(value)) {
					const treeMap = buildTreeFieldsMap(config, value, path);
					map = { ...map, ...treeMap };
				}
			}
		}
	};

	traverseData(data, formFields, '');

	return map;
};
