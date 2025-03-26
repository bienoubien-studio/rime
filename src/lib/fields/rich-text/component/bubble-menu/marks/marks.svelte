<script lang="ts">
	import IconButton from '../icon-button/icon-button.svelte';
	import type { Editor } from '@tiptap/core';
	import type { RichTextModifier } from 'rizom/fields/rich-text/core/types';
	import { onMount } from 'svelte';

	type Props = {
		editor: Editor;
		marks: RichTextModifier[];
	};
	const { editor, marks }: Props = $props();

	export function updateActiveMarks() {
		activeMarks = Object.fromEntries(
			marks.map((mark) => [mark.name, mark.isActive(editor) ])
		);
	}

	onMount(() => {
		editor.on('update', () => {
			updateActiveMarks()
		})
		activeMarks = Object.fromEntries(
			marks.map((mark) => [mark.name, mark.isActive(editor) ])
		);
	})

	let activeMarks = $state(Object.fromEntries(marks.map((mark) => [mark.name, false])));
</script>

{#each marks as mark, index (index)}
	{#if mark.name}
		<IconButton active={activeMarks[mark.name]} icon={mark.icon} onclick={() => mark.command(editor)} />
	{/if}
{/each}
