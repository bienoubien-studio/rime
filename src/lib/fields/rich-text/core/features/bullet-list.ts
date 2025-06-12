import { List } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../types';
import BulletList from '@tiptap/extension-bullet-list';

const bulletListFeatureNode: RichTextFeatureNode = {
	name: 'ul',
	label: 'Bullet list',
	icon: List,
	isActive: ({ editor }) => editor.isActive('bulletList'),
	bubbleMenu: {
		command: ({ editor }) => editor.chain().focus().toggleBulletList().run()
	},
	suggestion: {
		command: ({ editor }) => editor.chain().focus().toggleBulletList().run()
	}
};

export const BulletListFeature: RichTextFeature = {
	name: 'ul',
	extension: BulletList,
	nodes: [bulletListFeatureNode]
};
