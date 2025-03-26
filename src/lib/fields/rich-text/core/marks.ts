import { BoldIcon, Code, Highlighter, ItalicIcon, StrikethroughIcon } from "@lucide/svelte";
import type { RichTextModifier } from "./types";

export const defaultMarks: RichTextModifier[] = [
	{
		name: 'b',
		command: (editor) => {
			editor.chain().focus().toggleBold().run();
		},
		isActive: (editor) => editor.isActive('bold'),
		icon: BoldIcon
	},
	{
		name: 'i',
		command: (editor) => editor.chain().focus().toggleItalic().run(),
		isActive: (editor) => editor.isActive('italic'),
		icon: ItalicIcon
	},
	{
		name: 's',
		command: (editor) => editor.chain().focus().toggleStrike().run(),
		isActive: (editor) => editor.isActive('strike'),
		icon: StrikethroughIcon
	},
	{
		name: 'code',
		command: (editor) => editor.chain().focus().toggleCode().run(),
		isActive: (editor) => editor.isActive('code'),
		icon: Code
	},
	{
		name: 'h',
		command: (editor) => editor.chain().focus().toggleHighlight().run(),
		isActive: (editor) => editor.isActive('highlight'),
		icon: Highlighter
	},
]