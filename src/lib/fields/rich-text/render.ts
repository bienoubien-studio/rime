import { generateHTML } from '@tiptap/html';
import { type Extensions, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { RichTextLink } from './component/extensions/Link';

export const renderRichText = (value?: JSONContent, extensions?: Extensions) => {
	if (!value) return '';
	return generateHTML(value, [StarterKit, RichTextLink, ...(extensions || [])]);
};
