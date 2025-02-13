import type { AnyField, AnyFormField } from 'rizom/types/fields.js';
import {
	isBlocksField,
	isBlocksFieldRaw,
	isFormField,
	toFormFields
} from '../../../utils/field.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility.js';

export type ConfigMap = Record<string, AnyFormField>;

export const buildConfigMap = (incomingData: Partial<GenericDoc>, incomingFields: AnyField[]) => {
	let map: ConfigMap = {};

	const formFields = incomingFields.reduce(toFormFields, []);

	const traverseData = (data: Dic, fields: AnyField[], basePath: string) => {
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
				}
			}
		}
	};

	traverseData(incomingData, formFields, '');

	return map;
};
