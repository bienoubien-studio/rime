import { templateUniqueRequired } from '$lib/adapter-sqlite/generate-schema/templates.server.js';
import { getSchemaColumnNames } from '$lib/adapter-sqlite/generate-schema/util.js';
import type { ToSchema, ToType } from '../index.server.js';
import type { NumberFieldBuilder } from './index.js';

export const toSchema: ToSchema<NumberFieldBuilder> = (field, parentPath?: string) => {
	const { camel, snake } = getSchemaColumnNames({ name: field.name, parentPath });
	const suffix = templateUniqueRequired(field.raw);
	if (field._generateSchema) return field._generateSchema({ camel, snake, suffix });
	return `${camel}: real('${snake}')${suffix}`;
};

export const toType: ToType<NumberFieldBuilder> = (field) => {
	return `${field.name}${field.raw.required ? '' : '?'}: number`;
};
