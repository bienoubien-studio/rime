import type { BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import Separator from './component/Separator.svelte';

class SeparatorFieldBuilder extends FieldBuilder<SeparatorField> {
	get component() {
		return Separator;
	}
}

type PublicSeparatorFieldBuilder = Omit<SeparatorFieldBuilder, 'component'>;
export const separator = () =>
	new SeparatorFieldBuilder('separator') as PublicSeparatorFieldBuilder;

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
		separator: any;
	}
	interface RegisterFields {
		SeparatorField: SeparatorField; // register the field type
	}
}
