import type { BaseField } from 'rizom/types/fields';
import { FieldBuilder } from '../_builders/index.js';
import type { FieldAccess } from 'rizom/types/fields';
import type { Component } from 'svelte';

export const component = (component: Component) => new ComponentFieldBuilder(component);

class ComponentFieldBuilder extends FieldBuilder<ComponentField> {
	//
	constructor(component: Component) {
		super('component');
		this.field.component = component;
	}
	condition(func: (doc: any) => boolean) {
		this.field.condition = func;
		return this;
	}
	access(access: { read?: FieldAccess }) {
		this.field.access = access;
		return this;
	}
}

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
