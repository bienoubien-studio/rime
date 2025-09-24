import { templateUniqueRequired } from '$lib/adapter-sqlite/generate-schema/templates.server.js';
import { getSchemaColumnNames } from '$lib/adapter-sqlite/generate-schema/util.js';
import { RizomError } from '$lib/core/errors/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import type { AreaSlug, CollectionSlug, PrototypeSlug } from '$lib/types.js';
import { trycatch } from '$lib/util/function.js';
import type { LinkFieldBuilder } from './index.js';
import type { ToSchema, ToType } from '../index.server.js';
import type { FieldHook, LinkField } from '../types.js';
import type { Link } from './types.js';

export const toSchema: ToSchema<LinkFieldBuilder> = (field, parentPath) => {
	const { camel, snake } = getSchemaColumnNames({ name: field.name, parentPath });
	const suffix = templateUniqueRequired(field.raw);
	if (field._generateSchema) return field._generateSchema({ camel, snake, suffix });
	return `${camel}: text('${snake}', { mode: 'json'})${suffix}`;
};

export const toType: ToType<LinkFieldBuilder> = (field: LinkFieldBuilder) => {
	return `${field.name}${field.raw.required ? '' : '?'}: Link`;
};

export const populateRessourceURL: FieldHook<LinkField> = async (link: Link, { event, documentId, operation }) => {
	if (!link) return link;

	// if not a resource return original value
	if (['url', 'email', 'tel', 'anchor'].includes(link.type)) return link;

	// Compare with the current document beign processed to prevent infinite loop
	if (link.value === documentId) return link;

	// If falsy value return link
	if (!link.value) return link;

	//
	if (!operation.params.depth || operation.params.depth === 0) {
		return link;
	}

	const { rizom, locale } = event.locals;

	async function getRessource(slug: PrototypeSlug) {
		switch (true) {
			case rizom.config.isCollection(slug):
				return await rizom.collection(slug as CollectionSlug).findById({
					id: link.value || '',
					locale: locale,
					select: ['url']
				});
			case rizom.config.isArea(slug):
				return await rizom.area(slug as AreaSlug).find({
					locale: locale,
					select: ['url']
				});
		}
	}

	const [error, doc] = await trycatch(getRessource(link.type as PrototypeSlug));

	if (doc && doc.url) {
		link.url = doc.url;
		return link;
	}

	if (error instanceof RizomError && error.code === RizomError.NOT_FOUND) {
		logger.warn(`Link field : ${link.type} ${link.value || '?'} not found`);
		return link;
	}

	return link;
};
