import { flatten, unflatten } from 'flat';
import { RizomError } from 'rizom/errors';
import { hasProps } from 'rizom/utils/object';
import { eq, inArray } from 'drizzle-orm';
import type { Adapter } from 'rizom/types/adapter.js';
import { isRelationField, isSelectField } from '$lib/utils/field.js';
import { rizom, type FormField } from '$lib/index.js';
import type { Task } from '../../../index.server';
import type { RelationField, SelectField } from 'rizom/fields/types';
import type { Dic } from 'rizom/types/utility';

export const setDefaultValues: Task = async (ctx, next) => {
	const { adapter } = ctx;
	const { configMap, incomingFieldsResolver } = ctx.internal;

	if (!configMap || !incomingFieldsResolver) throw new RizomError(RizomError.PIPE_ERROR);
	const output: Dic = flatten(ctx.data);

	for (const [key, config] of Object.entries(configMap)) {
		const field = incomingFieldsResolver.useFieldServer(key);
		let isEmpty;
		try {
			isEmpty = config.isEmpty(field.value);
		} catch (err: any) {
			isEmpty = false;
			console.log(err.message);
		}
		if (isEmpty && hasProps(config, ['defaultValue'])) {
			output[key] = await getDefaultValue({ key, config, adapter });
		}
	}

	ctx.data = unflatten(output);

	await next();
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
