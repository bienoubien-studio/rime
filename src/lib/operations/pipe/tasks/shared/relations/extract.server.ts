import { isRelationField } from '$lib/utils/field.js';
import type { BeforeOperationRelation } from '$lib/db/relations.js';
import type { FieldResolverServer } from '../field-resolver/index.server';
import type { ConfigMap } from '../field-resolver/map/types';

type Args = {
	parentId?: string;
	resolver: FieldResolverServer;
	configMap: ConfigMap;
	locale: string | undefined;
};

export const extractRelations = ({ parentId, resolver, configMap, locale }: Args) => {
	const relations: BeforeOperationRelation[] = [];
	const emptyPaths: string[] = [];

	for (const [path, config] of Object.entries(configMap)) {
		if (isRelationField(config)) {
			const field = resolver.useFieldServer(path);
			const localized = config.localized;
			const relationRawValue: BeforeOperationRelation[] | string | string[] = field.value;
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

			// Check if it's an empty array
			if (Array.isArray(relationRawValue) && relationRawValue.length === 0) {
				emptyPaths.push(path);
				// Check if it's an array
			} else if (Array.isArray(relationRawValue)) {
				output = relationRawValue.map((value, n) => {
					if (typeof value === 'string') {
						return relationFromString({ value, position: n });
					}
					return value;
				});
				// Check if it's a string
			} else if (typeof relationRawValue === 'string') {
				output = [relationFromString({ value: relationRawValue, position: 0 })];
			}
			relations.push(...output);
		}
	}

	return { relations, emptyPaths };
};

type RelationFromStringArgs = {
	value: string;
	position?: number;
};
