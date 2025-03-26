import { generateHTML } from '@tiptap/html';
import { type Extensions, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

export const renderRichText = (value?: JSONContent, extensions?: Extensions) => {
	if (!value) return '';
	return generateHTML(value, [StarterKit, Link.extend({ inclusive: false }).configure({
		HTMLAttributes: {
			class: 'rz-rich-text-link'
		}
	}), ...(extensions || [])]);
};
