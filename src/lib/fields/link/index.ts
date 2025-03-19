import type { GetRegisterType } from 'rizom';
import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import LinkComp from './component/Link.svelte';
import type { FieldHook } from 'rizom/types/fields';
import validate from 'rizom/util/validate.js';
import { templateUniqueRequired } from 'rizom/bin/generate/schema/templates.js';

const populateRessourceURL: FieldHook<LinkField> = async (value: Link, { api, locale }) => {
	const hasValue = !!value;
	const isResourceLinkType = (type: LinkType): type is GetRegisterType<'PrototypeSlug'> =>
		!['url', 'email', 'tel', 'anchor'].includes(type);

	if (hasValue && isResourceLinkType(value.type)) {
		try {
			let doc;
			if (api.rizom.config.isCollection(value.type)) {
				doc = await api.collection(value.type).findById({ id: value.link || '', locale });
			} else {
				doc = await api.area(value.type).find({ locale });
			}
			if (!doc) {
				value.link = null;
				return value;
			}

			if (doc.url) value.url = doc.url;
		} catch (err) {
			console.log(err);
		}
	}

	return value;
};

class LinkFieldBuilder extends FormFieldBuilder<LinkField> {
	constructor(name: string) {
		super(name, 'link');
		this.field.isEmpty = (value: any) => !value || !value.link;
		this.field.validate = validate.link;
		this.field.layout = 'default';
		this.field.hooks = {
			beforeRead: [populateRessourceURL],
			beforeSave: [],
			beforeValidate: []
		};
	}

	get component() {
		return LinkComp;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: Link`;
	}

	layout(str: 'compact' | 'default') {
		this.field.layout = str;
		return this;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		return `${camel}: text('${snake}', { mode: 'json'})`;
	}

	unique() {
		this.field.unique = true;
		return this;
	}

	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}

	types(...values: LinkType[]) {
		this.field.types = values;
		return this;
	}
}

export const link = (name: string) => new LinkFieldBuilder(name);

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type LinkType = 'url' | 'email' | 'tel' | 'anchor' | GetRegisterType<'PrototypeSlug'>;
export type LinkField = FormField & {
	type: 'link';
	defaultValue?: string;
	layout: 'compact' | 'default';
	unique?: boolean;
	types?: LinkType[];
};

export type Link = {
	type: LinkType;
	link: string | null;
	target: string;
	url?: string;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		link: any;
	}
	interface RegisterFormFields {
		LinkField: LinkField; // register the field type
	}
}
