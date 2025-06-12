import { eq, inArray } from 'drizzle-orm';
import type { Adapter } from '$lib/adapter-sqlite/types.js';
import { isRelationField, isSelectField } from '$lib/util/field.js';
import type { FormField } from '$lib/fields/types.js';
import type { RelationField, SelectField } from '$lib/fields/types.js';
import type { Dic } from '$lib/util/types.js';
import type { ConfigMap } from '../configMap/types.js';
import { hasProp, getValueAtPath, setValueAtPath } from '$lib/util/object.js';
import { logger } from '$lib/core/logger/index.server.js';

export const setDefaultValues = async <T extends Dic>(args: {
	data: T;
	configMap: ConfigMap;
	adapter: Adapter;
	mode?: 'always' | 'required';
}) => {
	const { adapter, configMap } = args;
	const mode = args.mode || 'required';

	let output = { ...args.data };
	for (const [key, config] of Object.entries(configMap)) {
		let value = getValueAtPath(key, output);
		let isEmpty;
		const shouldAddDefault = mode === 'always' || (mode === 'required' && config.required);
		try {
			isEmpty = config.isEmpty(value);
		} catch {
			isEmpty = false;
			logger.warn(`Error in config.isEmpty for field ${key}`);
		}
		if (shouldAddDefault && isEmpty && hasProp('defaultValue', config)) {
			value = await getDefaultValue({ key, config, adapter });
			output = setValueAtPath(output, key, value);
		}
	}

	return output;
};

type GetDefaultValue = (args: {
	key: string;
	config: FormField & { defaultValue: any };
	adapter: Adapter;
}) => Promise<any>;

/**
 * This function convert any default value string | string[] of ids
 * to a RelationValue from an existing relation record
 */
const defaultRelationValue = async (config: RelationField, key: string, adapter: Adapter) => {
	const buildRelation = async (defaultValue: any) => {
		let condition;
		//@TODO encapsulate this into adapter.relation.something
		const relationTable = adapter.tables[config.relationTo];
		if (typeof defaultValue === 'string') {
			condition = eq(relationTable.id, defaultValue);
		} else if (Array.isArray(defaultValue)) {
			condition = inArray(relationTable.id, defaultValue);
		}
		const existing = (await adapter.db
			.select({ documentId: relationTable.id })
			.from(relationTable)
			.where(condition)) as { documentId: string }[];

		return existing.map(({ documentId }, index) => ({
			id: null,
			relationTo: config.relationTo,
			path: key,
			position: index,
			documentId: documentId
		}));
	};

	return await buildRelation(config.defaultValue);
};

export const getDefaultValue: GetDefaultValue = async ({ key, config, adapter }) => {
	if (isRelationField(config)) {
		return await defaultRelationValue(config, key, adapter);
	} else {
		if (typeof config.defaultValue === 'function') {
			return config.defaultValue();
		}
		return config.defaultValue;
	}
};
