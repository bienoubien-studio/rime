import { ListOrdered } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../types';
import OrderedList from '@tiptap/extension-ordered-list';

const orderedListFeatureNode: RichTextFeatureNode = {
	name: 'ol',
	label: 'Ordered list',
	icon: ListOrdered,
	isActive: ({ editor }) => editor.isActive('orderedList'),
	bubbleMenu: {
		command: ({ editor }) => editor.chain().focus().toggleOrderedList().run()
	},
	suggestion: {
		command: ({ editor }) => editor.chain().focus().toggleOrderedList().run()
	}
};

export const OrderedListFeature: RichTextFeature = {
	name: 'ol',
	extension: OrderedList,
	nodes: [orderedListFeatureNode]
};
