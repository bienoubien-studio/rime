import type { AnyField, FormField } from 'rizom/types/index.js';
import type { Dic } from 'rizom/types/utility.js';
import type { ComponentType } from 'svelte';

export { blocks, block, blueprint } from './field.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////
export type BlocksField = FormField & {
	type: 'blocks';
	blocks: BlocksFieldBlock[];
};

export type BlocksFieldBlockRenderTitle = (args: { fields: Dic; position: number }) => string;

export type BlocksFieldBlock = {
	name: string;
	label?: string;
	description?: string;
	icon?: ComponentType;
	renderTitle?: BlocksFieldBlockRenderTitle;
	fields: AnyField[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		blocks: any;
	}
	interface RegisterFormFields {
		BlocksField: BlocksField; // register the field type
	}
}
