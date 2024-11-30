import type { BaseField } from 'rizom/types/fields';
import type { Component } from 'svelte';

export { component } from './field.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type ComponentField = BaseField & {
	type: 'component';
	component: Component;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		component: any;
	}
	interface RegisterFields {
		ComponentField: ComponentField; // register the field type
	}
}
