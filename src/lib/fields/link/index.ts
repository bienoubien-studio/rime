import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import { logger } from '$lib/core/logger/index.server.js';
import type { DefaultValueFn, FieldHook, FormField } from '$lib/fields/types.js';
import { trycatch } from '$lib/util/trycatch.js';
import validate from '$lib/util/validate.js';
import type { AreaSlug, CollectionSlug, PrototypeSlug } from '../../types.js';
import { FormFieldBuilder } from '../builders/index.js';
import LinkComp from './component/Link.svelte';
import type { Link, LinkType } from './types.js';

// Before read populate ressource URL
const populateRessourceURL: FieldHook<LinkField> = async (link: Link, { event, documentId, operation }) => {
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

class LinkFieldBuilder extends FormFieldBuilder<LinkField> {
	constructor(name: string) {
		super(name, 'link');
		this.field.isEmpty = (link: unknown) => !link || (typeof link === 'object' && 'value' in link && !link.value);
		this.field.validate = validate.link;
		this.field.layout = 'default';
		this.field.types = ['url'];
		this.field.hooks = {
			beforeRead: [populateRessourceURL],
			beforeSave: [],
			beforeValidate: []
		};
	}

	get component() {
		return LinkComp;
	}

	_toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: Link`;
	}

	layout(str: 'compact' | 'default') {
		this.field.layout = str;
		return this;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if (this._generateSchema) return this._generateSchema({ camel, snake, suffix });
		return `${camel}: text('${snake}', { mode: 'json'})${suffix}`;
	}

	defaultValue(value: Link | DefaultValueFn<Link>) {
		this.field.defaultValue = value;
		return this;
	}

	types(...values: LinkType[]) {
		this.field.types = values;
		return this;
	}

	compile() {
		if (!this.field.defaultValue) {
			this.field.defaultValue = { value: '', target: '_self', type: this.field.types![0] };
		}
		return super.compile();
	}
}

export const link = (name: string) => new LinkFieldBuilder(name);

/****************************************************/
/* Type
/****************************************************/

export type LinkField = FormField & {
	type: 'link';
	defaultValue?: Link | DefaultValueFn<Link>;
	layout: 'compact' | 'default';
	types?: LinkType[];
};
