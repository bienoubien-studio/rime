import type { GetRegisterType } from 'rizom';
import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import toSnakeCase from 'to-snake-case';
import LinkComp from './component/Link.svelte';
import type { FieldHook } from 'rizom/types/fields';
import validate from 'rizom/utils/validate.js';

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
				doc = await api.global(value.type).find({ locale });
			}
			if (!doc) {
				value.link = null;
				return value;
			}
			if (doc._url) value._url = doc._url;
		} catch (err) {
			console.log(err);
		}
	}

	return value;
};

class LinkFieldBuilder extends FormFieldBuilder<LinkField> {
	constructor(name: string) {
		super(name, 'link');
		this.field.isEmpty = (value: any) => !value || !value.link || !value.label;
		this.field.validate = validate.link;
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

	toSchema() {
		const snake_name = toSnakeCase(this.field.name);
		return `${this.field.name}: text('${snake_name}', { mode: 'json' })`;
	}

	//
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
	unique?: boolean;
	types?: LinkType[];
};

export type Link = {
	label: string;
	type: LinkType;
	link: string | null;
	target: string;
	_url?: string;
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
