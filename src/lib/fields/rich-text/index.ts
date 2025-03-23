import type { FormField } from 'rizom/types/fields.js';
import { FormFieldBuilder } from '../builders/index.js';
import RichText from './component/RichText.svelte';
import Cell from './component/Cell.svelte';
import type { EditorOptions } from '@tiptap/core';

const isEmpty = (value: unknown) => {
	const reduceText = (prev: string, curr: any) => {
		if ('text' in curr) {
			prev += curr.text;
		} else if ('content' in curr) {
			return curr.content.reduce(reduceText, prev);
		}
		return prev;
	};
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype &&
		'content' in value &&
		Array.isArray(value.content) &&
		value.content.reduce(reduceText, '') === ''
	);
};

class RichTextFieldBuilder extends FormFieldBuilder<RichTextField> {
	constructor(name: string) {
		super(name, 'richText');
		this.field.isEmpty = isEmpty;
		this.field.marks = ['bold', 'italic', 'strike', 'underline'];
		this.field.nodes = ['p', 'h2', 'h3', 'ol', 'ul', 'blockquote', 'a'];
		this.field.hooks = {
			beforeRead: [RichTextFieldBuilder.jsonParse],
			beforeSave: [RichTextFieldBuilder.stringify],
			beforeValidate: []
		};
	}

	get component() {
		return RichText;
	}

	get cell() {
		return Cell;
	}

	toSchema(parentPath?: string) {
		const { camel, snake } = this.getSchemaName(parentPath);
		const suffix = this.field.required ? '.notNull()' : '';
		return `${camel}: text('${snake}')${suffix}`;
	}

	toType() {
		return `${this.field.name}${this.field.required ? '' : '?'}: import('@tiptap/core').JSONContent`;
	}

	marks(...marks: RichTextFieldMark[]) {
		if (marks && marks[0]) {
			this.field.marks = marks;
		} else {
			this.field.marks = [];
		}
		return this;
	}

	extensions(...extensions: EditorOptions["extensions"]) {
		console.log('set extensions', extensions);
		this.field.extensions = extensions;
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

	static readonly jsonParse = (value: string) => {
		try {
			value = JSON.parse(value);
		} catch (err: any) {
			if (typeof value === 'string') {
				return value;
			}
			return '';
		}
		return value;
	};

	static readonly stringify = (value: string) => {
		if (typeof value === 'string') return value;
		try {
			value = JSON.stringify(value);
		} catch (err: any) {
			console.error(err.message);
		}
		return value;
	};

	defaultValue(value: { type: 'doc'; content: any[] }) {
		this.field.defaultValue = value;
		return this;
	}
}

export const richText = (name: string) => new RichTextFieldBuilder(name);

export type RichTextField = FormField & {
	type: 'richText';
	marks: RichTextFieldMark[];
	nodes: RichTextFieldNode[];
	extensions?: EditorOptions["extensions"];
	defaultValue?: { type: 'doc'; content: any[] };
};
export type RichTextFieldMark = 'bold' | 'italic' | 'underline' | 'strike' | false;
export type RichTextFieldNode = 'p' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote' | 'a' | false;

export type RichTextMark = { type: string; attrs?: Record<string, any> };
export type RichTextNode<T extends string = string> = {
	type: T;
	content?: RichTextNode;
	text?: string;
	marks?: RichTextMark[];
} & (T extends 'heading' ? { attrs: Record<string, any> } : { attrs?: Record<string, any> }) &
	(T extends 'link' ? { url: string } : Record<never, never>);

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////

declare module 'rizom' {
	interface RegisterFieldsType {
		richText: any;
	}
	interface RegisterFormFields {
		RichTextField: RichTextField; // register the field type
	}
}
