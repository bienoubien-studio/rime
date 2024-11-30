import type { GetRegisterType } from 'rizom/types/register';
import type { FormField } from 'rizom/types';

export { link, blueprint } from './field.js';

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
