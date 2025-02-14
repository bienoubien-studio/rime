import { eq, inArray } from 'drizzle-orm';
import type { Adapter } from 'rizom/types/adapter.js';
import { isRelationField, isSelectField } from '$lib/utils/field.js';
import { rizom, type FormField } from '$lib/index.js';
import type {
	CheckboxField,
	ComboBoxField,
	DateField,
	EmailField,
	LinkField,
	NumberField,
	RadioField,
	RelationField,
	RichTextField,
	SelectField,
	TextField,
	ToggleField
} from 'rizom/fields/types';

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
