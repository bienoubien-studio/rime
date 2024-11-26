<script lang="ts">
	import IconButton from '../icon-button/icon-button.svelte';
	import BoldIcon from 'lucide-svelte/icons/bold';
	import ItalicIcon from 'lucide-svelte/icons/italic';
	import StrikethroughIcon from 'lucide-svelte/icons/strikethrough';
	import type { Editor } from '@tiptap/core';
	import { type ComponentType } from 'svelte';

	import type { RichTextFieldMark } from 'rizom/types/fields';

	type Props = {
		editor: Editor;
		marks: RichTextFieldMark[];
	};
	const { editor, marks }: Props = $props();

	export function updateActiveMarks() {
		activeMarks = Object.fromEntries(
			definedMarks.map((node) => [node.name, editor.isActive(node.name)])
		);
	}

	type Mark = {
		name: RichTextFieldMark;
		command: () => void;
		icon: ComponentType;
	};
	const availableMarks: Mark[] = [
		{
			name: 'bold',
			command: () => {
				editor.chain().focus().toggleBold().run();
				activeMarks.bold = editor.isActive('bold');
			},
			icon: BoldIcon
		},
		{
			name: 'italic',
			command: () => {
				editor.chain().focus().toggleItalic().run();
				activeMarks.italic = editor.isActive('italic');
			},
			icon: ItalicIcon
		},
		{
			name: 'strike',
			command: () => {
				editor.chain().focus().toggleStrike().run();
				activeMarks.strike = editor.isActive('strike');
			},
			icon: StrikethroughIcon
		}
	];

	let definedMarks = availableMarks.filter((mark) => marks.includes(mark.name));

	let activeMarks = $state(Object.fromEntries(availableMarks.map((node) => [node.name, false])));
</script>

{#each definedMarks as mark, index (index)}
	{#if mark.name}
		<IconButton active={activeMarks[mark.name]} icon={mark.icon} onclick={mark.command} />
	{/if}
{/each}
