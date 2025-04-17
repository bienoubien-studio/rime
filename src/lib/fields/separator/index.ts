import type { Field } from '$lib/types/fields.js';
import { FieldBuilder } from '../builders/index.js';
import Separator from './component/Separator.svelte';

class SeparatorFieldBuilder extends FieldBuilder<SeparatorField> {
	get component() {
		return Separator;
	}
}

export const separator = () => new SeparatorFieldBuilder('separator');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type SeparatorField = Field & {
	type: 'separator';
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		separator: any;
	}
	interface RegisterFields {
		SeparatorField: SeparatorField; // register the field type
	}
}
