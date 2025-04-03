import { eq, inArray } from 'drizzle-orm';
import type { Adapter } from 'rizom/types/adapter.js';
import { isRelationField, isSelectField } from '$lib/util/field.js';
import type { FormField } from 'rizom/types/fields.js';
import type { RelationField, SelectField } from 'rizom/fields/types.js';
import type { Dic } from 'rizom/types/util.js';
import type { ConfigMap } from './configMap/types.js';
import { hasProp, getValueAtPath, setValueAtPath } from 'rizom/util/object.js';
import { logger } from 'rizom/util/logger/index.server.js';

export const setDefaultValues = async <T extends Dic>(args: {
	data: T;
	configMap: ConfigMap;
	adapter: Adapter;
}) => {
	const { adapter, configMap } = args;
	let output = { ...args.data };
	for (const [key, config] of Object.entries(configMap)) {
		let value = getValueAtPath(key, output);
		let isEmpty;
		try {
			isEmpty = config.isEmpty(value);
		} catch (err: any) {
			isEmpty = false;
			logger.warn(`Error while checking if field ${key} is empty`);
		}
		if (isEmpty && hasProp('defaultValue', config)) {
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

const defaultSelectValue = (config: SelectField) =>
	typeof config.defaultValue === 'string' ? [config.defaultValue] : config.defaultValue;

const defaultRelationValue = async (config: RelationField, key: string, adapter: Adapter) => {
	const buildRelation = async (defaultValue: any) => {
		let condition;
		const relationTable = adapter.tables[config.relationTo];
		if (typeof defaultValue === 'string') {
			condition = eq(relationTable.id, defaultValue);
		} else if (Array.isArray(defaultValue)) {
			condition = inArray(relationTable.id, defaultValue);
		}
		const existing = await adapter.db
			.select({ documentId: relationTable.id })
			.from(relationTable)
			.where(condition);

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
	if (isSelectField(config)) {
		return defaultSelectValue(config);
	} else if (isRelationField(config)) {
		return await defaultRelationValue(config, key, adapter);
	} else {
		if (typeof config.defaultValue === 'function') {
			return config.defaultValue();
		}
		return config.defaultValue;
	}
};
