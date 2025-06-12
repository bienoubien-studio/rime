// /Users/ai/Dev/rizom/src/lib/fields/rich-text/core/features/bold.ts
import { Text } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../types';
import Paragraph from '@tiptap/extension-paragraph';

const paragraphFeatureNode: RichTextFeatureNode = {
	name: 'p',
	label: 'Paragraph',
	icon: Text,
	isActive: ({ editor }) => editor.isActive('paragraph'),
	nodeSelector: {
		command: ({ editor }) => editor.chain().focus().setNode('paragraph').run()
	}
};

export const ParagraphFeature: RichTextFeature = {
	name: 'paragraph',
	extension: Paragraph.configure(),
	nodes: [paragraphFeatureNode]
};
