import type { GetRegisterType } from '$lib/index.js';
import { FormFieldBuilder } from '../builders/index.js';
import LinkComp from './component/Link.svelte';
import type { FormField, FieldHook, DefaultValueFn } from '$lib/fields/types.js';
import validate from '$lib/util/validate.js';
import type { Link, LinkType } from './types.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';

// Before save populate ressource URL
const populateRessourceURL: FieldHook<LinkField> = async (value: Link, { event, documentId }) => {
	const hasValue = !!value;
	const isResourceLinkType = (type: LinkType): type is GetRegisterType<'PrototypeSlug'> =>
		!['url', 'email', 'tel', 'anchor'].includes(type);

	if (hasValue && isResourceLinkType(value.type)) {
		const link = value;

		// Compare with the current document beign processed to prevent infinite loop
		if (link.value !== documentId) {
			try {
				let doc;
				if (event.locals.rizom.config.isCollection(link.type)) {
					doc = await event
						.fetch(
							`${process.env.PUBLIC_RIZOM_URL}/api/${value.type}?where[id][equals]=${link.value}&locale=${event.locals.locale}&select=url`
						)
						.then((r) => r.json())
						.then((r) => r.docs[0]);
				} else if (event.locals.rizom.config.isArea(link.type)) {
					doc = await event
						.fetch(`${process.env.PUBLIC_RIZOM_URL}/api/${value.type}?locale=${event.locals.locale}&select=url`)
						.then((r) => r.json())
						.then((r) => r.doc);
				}
				if (!doc) {
					link.value = null;
					return value;
				}
				if (doc.url) value.url = doc.url;
			} catch (err: any) {
				if (err.code === 'not_found') {
					console.warn(`Link field : ${link.type} ${documentId} not found`);
					return null;
				}
				// catch 404
				console.error(err);
			}
		}
	}

	return value;
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
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
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
