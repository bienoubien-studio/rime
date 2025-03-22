<script lang="ts">
	import IconButton from '../icon-button/icon-button.svelte';
	import {BoldIcon, ItalicIcon, StrikethroughIcon } from '@lucide/svelte';
	import type { Editor } from '@tiptap/core';
	import { type Component } from 'svelte';
	import type { RichTextFieldMark } from '../../../index.js';
	import type { IconProps } from '@lucide/svelte';

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
		icon: Component<IconProps>;
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
