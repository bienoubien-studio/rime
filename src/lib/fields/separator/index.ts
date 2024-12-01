import type { BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { AnyField } from 'rizom/types';
import Separator from './component/Separator.svelte';

export const blueprint = {
	component: Separator,
	match: (field: AnyField): field is SeparatorField => field.type === 'separator'
};

export const separator = () => new FieldBuilder<SeparatorField>('separator');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SeparatorField = BaseField & {
	type: 'separator';
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		slug: any;
	}
	interface RegisterFields {
		SeparatorField: SeparatorField; // register the field type
	}
}
