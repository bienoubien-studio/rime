import type { AnyField, FormField } from 'rizom/types/index.js';
import type { Dic } from 'rizom/types/utility.js';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Tree from './component/Tree.svelte';
import Cell from './component/Cell.svelte';
import type { ComponentType } from 'svelte';
import { text } from '../text/index.js';
import { number } from '../number/index.js';
import type { Field } from 'rizom/types/fields.js';

export const tree = (name: string) => new TreeBuilder(name);

export class TreeBuilder extends FormFieldBuilder<TreeField> {
	constructor(name: string) {
		super(name, 'tree');
		this.field.defaultValue = [];
		this.field.isEmpty = (value) => !value || (Array.isArray(value) && value.length === 0);
		this.field.fields = [text('path').hidden(), number('position').hidden()];
	}

	get component() {
		return Tree;
	}
	get cell() {
		return Cell;
	}

	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = [...(this.field.fields || []), ...fields];
		return this;
	}

	renderTitle(render: TreeFieldRenderTitle) {
		this.field.renderTitle = render;
		return this;
	}

	compile() {
		return {
			...this.field,
			fields: this.field.fields.map((f) => f.compile())
		};
	}
	// blocks(...blocks: TreeFieldBlock[]) {
	// 	this.field.blocks = blocks;
	// 	return this;
	// }
}

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////
export type TreeFieldRenderTitle = (args: { fields: Dic }) => string;
export type TreeField = FormField & {
	type: 'tree';
	renderTitle?: TreeFieldRenderTitle;
	fields: FieldBuilder<Field>[];
};

export type TreeFieldBlockRenderTitle = (args: { fields: Dic; position: number }) => string;

export type TreeFieldRaw = FormField & {
	type: 'tree';
	renderTitle?: TreeFieldRenderTitle;
	fields: Field[];
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		tree: any;
	}
	interface RegisterFormFields {
		TreeField: TreeField | TreeFieldRaw;
	}
}
