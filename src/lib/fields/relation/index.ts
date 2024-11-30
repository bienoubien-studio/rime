import type { GetRegisterType } from 'rizom/types/register';
import type { FormField } from 'rizom/types';

export { relation, blueprint } from './field.js';

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type RelationField = FormField & {
	type: 'relation';
	relationTo: GetRegisterType<'PrototypeSlug'>;
	layout?: 'tags' | 'list';
	many?: boolean;
	defaultValue?: string | string[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		relation: any;
	}
	interface RegisterFormFields {
		RelationField: RelationField; // register the field type
	}
}
