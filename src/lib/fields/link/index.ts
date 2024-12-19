import type { GetRegisterType } from 'rizom/types/register';
import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import toSnakeCase from 'to-snake-case';
import LinkComp from './component/Link.svelte';
import type { FieldBluePrint, FieldHook } from 'rizom/types/fields';
import validate from 'rizom/utils/validate.js';

export const blueprint: FieldBluePrint<LinkField> = {
	component: LinkComp,
	toSchema(field) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		return `${name}: text('${snake_name}', { mode: 'json' })`;
	},
	toType: (field) => `${field.name}${field.required ? '' : '?'}: Link`
};

const populateRessourceURL: FieldHook<LinkField> = async (value, { api, locale }) => {
	const hasValue = !!value;
	const isResourceLinkType = (type: LinkType): type is GetRegisterType<'PrototypeSlug'> =>
		!['url', 'email', 'tel', 'anchor'].includes(type);

	if (hasValue && isResourceLinkType(value.type)) {
		try {
			let doc;
			if (api.rizom.config.isCollection(value.type)) {
				doc = await api.collection(value.type).findById({ id: value.link, locale });
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
		this.field.isEmpty = (value: Link) => !value.link || !value.label;
		this.field.hooks = {
			beforeRead: [populateRessourceURL],
			beforeSave: [],
			beforeValidate: []
		};
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
	defineValidationFunction() {
		return validate.link;
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
	link: string;
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
