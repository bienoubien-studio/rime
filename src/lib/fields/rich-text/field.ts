import { FormFieldBuilder } from '../field-builder.js';
import type { RichTextField, RichTextFieldMark, RichTextFieldNode } from './index.js';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import RichText from './component/RichText.svelte';
import Cell from './component/Cell.svelte';

export const blueprint = {
	component: RichText,
	cell: Cell,
	toSchema(field: RichTextField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = field.required ? '.required()' : '';
		return `${name}: text('${snake_name}')${suffix}`;
	},
	toType: (field: RichTextField) => `${field.name}: string`,
	match: (field: AnyField): field is RichTextField => field.type === 'richText'
};

class RichTextFieldBuilder extends FormFieldBuilder<RichTextField> {
	constructor(name: string) {
		super(name, 'richText');
		this.field.marks = ['bold', 'italic', 'strike', 'underline'];
		this.field.nodes = ['p', 'h2', 'h3', 'ol', 'ul', 'blockquote', 'a'];
	}

	marks(...marks: RichTextFieldMark[]) {
		if (marks && marks[0]) {
			this.field.marks = marks;
		} else {
			this.field.marks = [];
		}
		return this;
	}

	nodes(...nodes: RichTextFieldNode[]) {
		if (nodes && nodes[0]) {
			this.field.nodes = nodes;
		} else {
			this.field.nodes = [];
		}
		return this;
	}

	defaultValue(value: { type: 'doc'; content: any[] }) {
		this.field.defaultValue = value;
		return this;
	}
}

export const richText = (name: string) => new RichTextFieldBuilder(name);
