import { hasProp } from 'rizom/util/object';
import { eq, inArray } from 'drizzle-orm';
import type { Adapter } from 'rizom/types/adapter.js';
import { isRelationField, isSelectField } from '$lib/util/field.js';
import { rizom, type FormField } from '$lib/index.js';
import type { RelationField, SelectField } from 'rizom/fields/types';
import type { Dic } from 'rizom/types/util';
import type { ConfigMap } from './configMap/types';
import { getValueAtPath, setValueAtPath } from 'rizom/util/object';

export const setDefaultValues = async <T extends Dic>(args: {
	data: T;
	configMap: ConfigMap;
	adapter: Adapter;
}) => {
	const { adapter, configMap } = args;
	let output = { ...args.data };
	for (const [key, config] of Object.entries(configMap)) {
		let value = getValueAtPath(output, key);
		let isEmpty;
		try {
			isEmpty = config.isEmpty(value);
		} catch (err: any) {
			isEmpty = false;
			console.log(err.message);
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
		const relationTable = rizom.adapter.tables[config.relationTo];
		if (typeof defaultValue === 'string') {
			condition = eq(relationTable.id, defaultValue);
		} else if (Array.isArray(defaultValue)) {
			condition = inArray(relationTable.id, defaultValue);
		}
		const existing = await adapter.db
			.select({ relationId: relationTable.id })
			.from(relationTable)
			.where(condition);

		return existing.map(({ relationId }, index) => ({
			id: null,
			relationTo: config.relationTo,
			path: key,
			position: index,
			relationId: relationId
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
