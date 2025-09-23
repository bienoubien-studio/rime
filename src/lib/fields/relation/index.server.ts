import { templateUniqueRequired } from '$lib/adapter-sqlite/generate-schema/templates.server';
import { getSchemaColumnNames } from '$lib/adapter-sqlite/generate-schema/util';
import { RizomError } from '$lib/core/errors';
import { logger } from '$lib/core/logger/index.server';
import type { GenericDoc } from '$lib/types';
import { capitalize } from '$lib/util/string';
import type { RelationFieldBuilder } from '.';
import type { ToSchema, ToType } from '../index.server';
import type { FieldHook, RelationField, RelationValue } from '../types';

export const toSchema: ToSchema<RelationFieldBuilder<any>> = (field, parentPath) => {
	const { camel, snake } = getSchemaColumnNames({ name: field.name, parentPath });
	const suffix = templateUniqueRequired(field.raw);
	if (field._generateSchema) return field._generateSchema({ camel, snake, suffix });
	return `${camel}: text('${snake}', { mode: 'json' })${suffix}`;
};

export const toType: ToType<RelationFieldBuilder<any>> = (field) => {
	return `${field.name}${field.raw.required ? '' : '?'}: RelationValue<${capitalize(field.raw.relationTo)}Doc>`;
};

export const ensureRelationExists: FieldHook<RelationField<GenericDoc>> = async (
	value: RelationValue<any>,
	{ event, config }
) => {
	const output = [];

	const retrieveRelation = async (id: string) => {
		try {
			return await event.locals.rizom.collection(config.relationTo).findById({ id, select: ['id'] });
		} catch (err: any) {
			logger.error('Error in relation beforValidate hook : ' + err.message);
			throw new RizomError(RizomError.OPERATION_ERROR, err.message);
		}
	};

	if (value && Array.isArray(value)) {
		for (const relation of value) {
			let documentId;
			if (typeof relation === 'string') {
				documentId = relation;
			} else {
				documentId = relation.documentId;
			}
			if (!documentId) {
				continue;
			}
			const doc = await retrieveRelation(documentId);
			if (doc) {
				output.push(relation);
			}
		}
	} else if (typeof value === 'string') {
		const doc = await retrieveRelation(value);
		if (doc) {
			output.push(doc.id);
		}
	}

	return output;
};
