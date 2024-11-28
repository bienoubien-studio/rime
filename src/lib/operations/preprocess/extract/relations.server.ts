import { isRelationField } from '$lib/utils/field.js';
import type { Relation } from '$lib/db/relations.js';
import type { ConfigMap } from '../config/map.js';
import type { Dic } from 'rizom/types/utility.js';

type Args = { flatData: Dic; configMap: ConfigMap; locale: string | undefined };
type BeforeOperationRelation = Omit<Relation, 'parentId'>;

export const extractRelations = ({ flatData, configMap, locale }: Args) => {
	const relations: BeforeOperationRelation[] = [];

	for (const [path, config] of Object.entries(configMap)) {
		if (isRelationField(config)) {
			const localized = config.localized;
			const relationRawValue: BeforeOperationRelation[] | string | string[] = flatData[path];
			let output: BeforeOperationRelation[] = [];

			const relationFromString = ({ value, position = 0 }: RelationFromStringArgs) => {
				const result: BeforeOperationRelation = {
					position,
					relationTo: config.relationTo,
					relationId: value,
					path
				};
				if (localized) {
					result.locale = locale;
				}
				return result;
			};

			if (Array.isArray(relationRawValue)) {
				output = relationRawValue.map((value, n) => {
					if (typeof value === 'string') {
						return relationFromString({ value, position: n });
					}
					return value;
				});
			} else if (typeof relationRawValue === 'string') {
				output = [relationFromString({ value: relationRawValue, position: 0 })];
			}
			relations.push(...output);
		}
	}

	return { relations };
};

type RelationFromStringArgs = {
	value: string;
	position?: number;
};
