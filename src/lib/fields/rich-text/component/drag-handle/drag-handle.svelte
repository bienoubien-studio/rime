<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { GripVertical } from '@lucide/svelte';
	import { DragHandlePlugin } from './drag-handle-plugin';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		editor: Editor;
		element?: HTMLElement;
	};

	let { editor, element = $bindable() }: Props = $props();

	const pluginKey = new Date().getTime().toString();

	onMount(() => {
		const plugin = DragHandlePlugin({
			pluginKey,
			dragHandleWidth: 26,
			scrollTreshold: 20,
			dragHandleSelector: '.rz-rich-text-grip',
			excludedTags: [],
			customNodes: []
		});
		editor.registerPlugin(plugin);
	});

	onDestroy(() => {
		editor.unregisterPlugin(pluginKey);
	});
</script>

<div id={pluginKey} bind:this={element} class="rz-rich-text-grip ">
	<GripVertical size="14" />
</div>

<style>
	:global(.prosemirror-dropcursor-block) {
		opacity: 0.4;
		border: 1px solid hsl(var(--rz-color-primary));
	}
	:global(.rz-field-rich-text--standalone .rz-rich-text__editor .ProseMirror > *) {
		padding-left: 1rem;
		padding-right: 1rem;
	}
	:global(.rz-rich-text__wrapper){
		.rz-rich-text-grip{
			opacity: 0;
		}
	}
	:global(.rz-rich-text__wrapper:hover){
		.rz-rich-text-grip{
			opacity: 1;
		}
	}
	.rz-rich-text-grip :global {
		position: absolute;
		top: 0;
		translate: 0.6rem 0;
		z-index: 10;
		cursor: grab;
		
		&.hide {
			opacity: 0;
			pointer-events: none;
		}

	}
</style>
