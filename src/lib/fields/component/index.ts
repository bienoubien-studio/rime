import type { Field } from 'rizom/types/fields.js';
import { FieldBuilder } from '../builders/index.js';
import type { FieldAccess } from 'rizom/types/fields';
import type { Component } from 'svelte';
import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte.js';
import type { GenericDoc } from 'rizom/types/index.js';

type TypedComponent = Component<{
	path: string;
	config: ComponentField;
	form: DocumentFormContext<GenericDoc>;
}>;

export const component = (component: TypedComponent) => new ComponentFieldBuilder(component);

class ComponentFieldBuilder extends FieldBuilder<ComponentField> {
	//
	constructor(component: TypedComponent) {
		super('component');
		this.field.component = component;
	}
	condition(func: (doc: any) => boolean) {
		this.field.condition = func;
		return this;
	}
	access(access: { create: FieldAccess; read: FieldAccess; update: FieldAccess }) {
		this.field.access = access;
		return this;
	}
}

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type ComponentField = Field & {
	type: 'component';
	component: TypedComponent;
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
