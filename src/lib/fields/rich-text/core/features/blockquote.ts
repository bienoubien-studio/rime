import { TextQuote } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../types.js';
import Blockquote from '@tiptap/extension-blockquote';

const blockquoteFeatureNode: RichTextFeatureNode = {
	name: 'blockquote',
	label: 'Blockquote',
	icon: TextQuote,
	isActive: ({ editor }) => editor.isActive('blockquote'),
	nodeSelector: {
		command: ({ editor }) => editor.chain().focus().toggleBlockquote().run()
	},
	suggestion: {
		command: ({ editor }) => editor.chain().focus().toggleBlockquote().run()
	}
};

export const BlockquoteFeature: RichTextFeature = {
	name: 'blockquote',
	extension: Blockquote,
	nodes: [blockquoteFeatureNode]
};
