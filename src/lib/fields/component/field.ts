import type { ComponentField } from './index.js';
import { FieldBuilder } from '../field-builder';
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
