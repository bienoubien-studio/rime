// /Users/ai/Dev/rizom/src/lib/fields/rich-text/core/features/heading.ts
import { Heading1Icon, Heading2Icon, Heading3Icon, Heading4Icon, Heading5Icon, Heading6Icon } from '@lucide/svelte';
import type { RichTextFeature, RichTextFeatureNode } from '../types.js';
import Heading, { type Level } from '@tiptap/extension-heading';

// Create the heading extension
const headingExtension = (levels?: Level[]) =>
	Heading.configure({
		levels: levels || [1, 2, 3, 4, 5, 6],
		HTMLAttributes: { class: 'rz-rich-text-heading' }
	});

// Create heading feature items for each level
const headingItems: RichTextFeatureNode[] = [
	{
		name: 'heading1',
		label: 'Heading 1',
		icon: Heading1Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 1 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 1 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 1 }).run()
		}
	},
	{
		name: 'heading2',
		label: 'Heading 2',
		icon: Heading2Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 2 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 2 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 2 }).run()
		}
	},
	{
		name: 'heading3',
		label: 'Heading 3',
		icon: Heading3Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 3 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 3 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 3 }).run()
		}
	},
	{
		name: 'heading4',
		label: 'Heading 4',
		icon: Heading4Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 4 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 4 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 4 }).run()
		}
	},
	{
		name: 'heading5',
		label: 'Heading 5',
		icon: Heading5Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 5 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 5 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 5 }).run()
		}
	},
	{
		name: 'heading6',
		label: 'Heading 6',
		icon: Heading6Icon,
		isActive: ({ editor }) => editor.isActive('heading', { level: 6 }),
		nodeSelector: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 6 }).run()
		},
		suggestion: {
			command: ({ editor }) => editor.chain().focus().toggleHeading({ level: 6 }).run()
		}
	}
];

// Export the heading feature with all levels
export const HeadingFeature = (...levels: Level[]): RichTextFeature => ({
	name: 'heading',
	extension: headingExtension(levels),
	nodes: levels.map((number) => headingItems[number - 1])
});
