import type { GetRegisterType } from 'rizom';
import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../builders/index.js';
import LinkComp from './component/Link.svelte';
import type { FieldHook } from 'rizom/types/fields';
import validate from 'rizom/util/validate.js';
import type { Link, LinkType } from './types.js';

// Before save populate ressource URL
const populateRessourceURL: FieldHook<LinkField> = async (value: Link, { api, locale, documentId }) => {
	const hasValue = !!value;
	const isResourceLinkType = (type: LinkType): type is GetRegisterType<'PrototypeSlug'> =>
		!['url', 'email', 'tel', 'anchor'].includes(type);
	
	if (hasValue && isResourceLinkType(value.type)) {
		const link = value
		
		// Compare with the current document beign processed to prevent infinite loop
		if( link.value !== documentId ){
			try {
				let doc;
				if (api.rizom.config.isCollection(link.type)) {
					doc = await api.collection(link.type).findById({ id: link.value || '', locale });
				} else if( api.rizom.config.isArea(link.type) ) {
					doc = await api.area(link.type).find({ locale });
				}
				if (!doc) {
					link.value = null;
					return value;
				}
				if (doc.url) value.url = doc.url;
			} catch (err:any) {
				if(err.code === 'not_found'){
					console.warn(`Link field : ${link.type} ${documentId} not found`)
					return null
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
		this.field.isEmpty = (link: unknown) => !link || typeof link === 'object' && 'value' in link && !link.value;
		this.field.validate = validate.link;
		this.field.layout = 'default';
		this.field.hooks = {
			beforeRead: [],
			beforeSave: [populateRessourceURL],
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

export type LinkField = FormField & {
	type: 'link';
	defaultValue?: string;
	layout: 'compact' | 'default';
	unique?: boolean;
	types?: LinkType[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		link: any;
	}
	interface RegisterFormFields {
		LinkField: LinkField;
	}
}
