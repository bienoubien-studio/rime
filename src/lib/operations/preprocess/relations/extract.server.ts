import { isRelationField } from '$lib/utils/field.js';
import type { BeforeOperationRelation } from '$lib/db/relations.js';
import type { ConfigMap } from '../config/map.js';
import type { Dic } from 'rizom/types/utility.js';

type Args = { parentId?: string; flatData: Dic; configMap: ConfigMap; locale: string | undefined };

export const extractRelations = ({ parentId, flatData, configMap, locale }: Args) => {
	const relations: BeforeOperationRelation[] = [];
	const emptyPaths: string[] = []; // Add this to track empty arrays

	for (const [path, config] of Object.entries(configMap)) {
		if (isRelationField(config)) {
			console.log(path);
			const localized = config.localized;
			const relationRawValue: BeforeOperationRelation[] | string | string[] = flatData[path];
			let output: BeforeOperationRelation[] = [];

			const relationFromString = ({ value, position = 0 }: RelationFromStringArgs) => {
				const result: BeforeOperationRelation = {
					position,
					relationTo: config.relationTo,
					relationId: value,
					parentId,
					path
				};
				if (localized) {
					result.locale = locale;
				}
				return result;
			};

			console.log('relationRawValue', relationRawValue);
			// Check if it's an empty array
			if (Array.isArray(relationRawValue) && relationRawValue.length === 0) {
				emptyPaths.push(path);
			} else if (Array.isArray(relationRawValue)) {
				output = relationRawValue.map((value, n) => {
					if (typeof value === 'string') {
						return relationFromString({ value, position: n });
					}
					return value;
				});
			} else if (typeof relationRawValue === 'string') {
				// console.log('relationRawValue is string : ', relationRawValue);
				output = [relationFromString({ value: relationRawValue, position: 0 })];
			}
			relations.push(...output);
		}
	}
	// console.log('Relation extract output', relations);
	return { relations, emptyPaths };
};

type RelationFromStringArgs = {
	value: string;
	position?: number;
};
