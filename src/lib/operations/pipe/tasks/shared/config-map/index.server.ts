import type { Field } from 'rizom/types/fields.js';
import { isBlocksFieldRaw, isFormField, isTreeFieldRaw, toFormFields } from 'rizom/utils/field.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility.js';
import { buildTreeFieldsMap } from './build-tree-map.server.js';
import type { ConfigMap } from './types.js';
import type { Task } from 'rizom/operations/pipe/index.server.js';
import { RizomError } from 'rizom/errors/index.js';

type DataType = 'original' | 'data' | 'document' | 'documents';

export const provideConfigMap = (key: DataType) => {
	const task: Task = async (ctx, next) => {
		const data = key === 'documents' ? ctx.documents?.[0] || {} : ctx[key];
		if (!data) throw new RizomError(RizomError.PIPE_ERROR, '@provideConfigMap missing ' + key);

		ctx.internal.configMap = buildConfigMap(data, ctx.config.fields);
		await next();
	};
	return task;
};

const buildConfigMap = (incomingData: Partial<GenericDoc>, incomingFields: Field[]) => {
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

	traverseData(incomingData, formFields, '');

	return map;
};
