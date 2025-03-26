import { Code, Heading2, Heading3, Heading4, Heading5, Heading6, TextIcon, TextQuote } from "@lucide/svelte";
import type { RichTextModifier } from "./types";

export const defaultNodes: RichTextModifier[] = [
	{
		name: 'p',
		label: 'Paragraph',
		icon: TextIcon,
		command: (editor) => {
			editor.chain().focus().setParagraph().run();
		},
		isActive: (editor) => editor.state.selection.$head.parent.type.name === 'paragraph'
	},
	{
		name: 'h2',
		label: 'Heading 2',
		icon: Heading2,
		command: (editor) => {
			editor.chain().focus().toggleHeading({ level: 2 }).run();
		},
		isActive: (editor) => editor.isActive('heading', { level: 2 })
	},
	{
		name: 'h3',
		label: 'Heading 3',
		icon: Heading3,
		command: (editor) => {
			editor.chain().focus().toggleHeading({ level: 3 }).run();
		},
		isActive: (editor) => editor.isActive('heading', { level: 3 })
	},
	{
		name: 'h4',
		label: 'Heading 4',
		icon: Heading4,
		command: (editor) => {
			editor.chain().focus().toggleHeading({ level: 4 }).run();
		},
		isActive: (editor) => editor.isActive('heading', { level: 4 })
	},
	{
		name: 'h5',
		label: 'Heading 5',
		icon: Heading5,
		command: (editor) => {
			editor.chain().focus().toggleHeading({ level: 5 }).run();
		},
		isActive: (editor) => editor.isActive('heading', { level: 5 })
	},
	{
		name: 'h6',
		label: 'Heading 6',
		icon: Heading6,
		command: (editor) => {
			editor.chain().focus().toggleHeading({ level: 6 }).run();
		},
		isActive: (editor) => editor.isActive('heading', { level: 6 })
	},
	{
		name: 'quote',
		label: 'Quote',
		icon: TextQuote,
		command: (editor) => {
			editor.chain().focus().toggleBlockquote().run();
		},
		isActive: (editor) => editor.isActive('blockquote')
	},
	{
		name: 'codeBlock',
		label: 'Code block',
		icon: Code,
		command: (editor) => {
			editor.chain().focus().toggleCodeBlock().run();
		},
		isActive: (editor) => editor.isActive('codeBlock')
	},
]