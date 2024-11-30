import type { FormField } from 'rizom/types';

export { richText, blueprint } from './field.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

export type RichTextField = FormField & {
	type: 'richText';
	marks: RichTextFieldMark[];
	nodes: RichTextFieldNode[];
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
