import { isRelationField } from '$lib/utils/field.js';
import type { BeforeOperationRelation } from '$lib/db/relations.js';
import type { FieldProviderServer } from '../fields/provider.server.js';

type Args = {
	parentId?: string;
	fieldProvider: FieldProviderServer;
	locale: string | undefined;
};

export const extractRelations = ({ parentId, fieldProvider, locale }: Args) => {
	const relations: BeforeOperationRelation[] = [];
	const emptyPaths: string[] = []; // Add this to track empty arrays

	for (const [path, config] of Object.entries(fieldProvider.configMap)) {
		if (isRelationField(config)) {
			const field = fieldProvider.useFieldServer(path);
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
			} else if (Array.isArray(relationRawValue)) {
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

	return { relations, emptyPaths };
};

type RelationFromStringArgs = {
	value: string;
	position?: number;
};
