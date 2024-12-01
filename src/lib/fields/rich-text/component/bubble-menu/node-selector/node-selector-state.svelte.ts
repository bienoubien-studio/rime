import type { Editor } from '@tiptap/core';
import Heading2 from 'lucide-svelte/icons/heading-2';
import Heading3 from 'lucide-svelte/icons/heading-3';
import TextQuote from 'lucide-svelte/icons/text-quote';
import TextIcon from 'lucide-svelte/icons/text';
import ListOrdered from 'lucide-svelte/icons/list-ordered';
// import { Code } from 'lucide-svelte';
import Asterisk from 'lucide-svelte/icons/asterisk';
import type { ComponentType } from 'svelte';
import type { RichTextFieldNode } from 'rizom/fields/types';

type Node = {
	name: RichTextFieldNode;
	label: string;
	icon: ComponentType;
	command: () => void;
	isActive: () => boolean;
};

export function createNodesState(editor: Editor) {
	let activeItems = $state<Node[]>([]);
	const activeItem = $derived(
		activeItems.length === 1
			? activeItems[0]
			: { name: 'Multiple', label: 'Multiple', icon: Asterisk }
	);

	editor.on('selectionUpdate', () => {
		setActiveItems();
	});

	const setActiveItems = () => {
		activeItems = items.filter((item) => item.isActive());
	};

	const items: Node[] = [
		{
			name: 'p',
			label: 'Paragraph',
			icon: TextIcon,
			command: () => {
				editor.chain().focus().setParagraph().run();
				setActiveItems();
			},
			isActive: () =>
				editor.isActive('paragraph') &&
				!editor.isActive('blockquote') &&
				!editor.isActive('bulletList') &&
				!editor.isActive('orderedList')
		},
		{
			name: 'h2',
			label: 'Heading 2',
			icon: Heading2,
			command: () => {
				editor.chain().focus().toggleHeading({ level: 2 }).run();
				setActiveItems();
			},
			isActive: () => editor.isActive('heading', { level: 2 })
		},
		{
			name: 'h3',
			label: 'Heading 3',
			icon: Heading3,
			command: () => {
				editor.chain().focus().toggleHeading({ level: 3 }).run();
				setActiveItems();
			},
			isActive: () => editor.isActive('heading', { level: 3 })
		},
		{
			name: 'ul',
			label: 'Bullet list',
			icon: ListOrdered,
			command: () => {
				editor.chain().focus().toggleBulletList().run();
				setActiveItems();
			},
			isActive: () => editor.isActive('bulletList')
		},
		{
			name: 'ol',
			label: 'Ordered list',
			icon: ListOrdered,
			command: () => {
				editor.chain().focus().toggleOrderedList().run();
				setActiveItems();
			},
			isActive: () => editor.isActive('orderedList')
		},
		{
			name: 'blockquote',
			label: 'Quote',
			icon: TextQuote,
			command: () => {
				editor.chain().focus().setParagraph().toggleBlockquote().run();
				setActiveItems();
			},
			isActive: () => editor.isActive('blockquote')
		}
		// {
		//   name: 'code',
		//   label: 'Code',
		//   icon: Code,
		//   command: () => {
		//     editor.chain().focus().toggleCodeBlock().run();
		//     setActiveItems();
		//   },
		//   isActive: () => editor.isActive('codeBlock')
		// }
	];

	return {
		items,

		get activeItem() {
			return activeItem;
		},

		get activeItems() {
			return activeItems;
		}
	};
}
