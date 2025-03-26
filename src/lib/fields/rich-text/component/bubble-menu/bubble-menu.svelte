<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import NodeSelector from './node-selector/node-selector.svelte';
	import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
	import { onDestroy, onMount } from 'svelte';
	import Marks from './marks/marks.svelte';
	import './bubble-menu.css';
	import type { RichTextEditorConfig, RichTextModifier } from '../../core/types';
	
	type Props = {
		editor: Editor;
		marks?: RichTextModifier[];
		nodes?: RichTextModifier[];
		extras?: RichTextEditorConfig['bubbleMenu']
	};
	
	const { editor, marks, nodes, extras }: Props = $props();

	let element: HTMLElement;
	let isOpen = $state(false)

	const pluginKey = new Date().getTime().toString()
	const updateDelay = 250;


	const onShow = () => {
		isOpen = true
	}

	const onHidden = () => {
		isOpen = false
	}

	const tippyOptions = {
		moveTransition: 'transform 0.15s ease-out',
		zIndex: 50,
		hideOnClick: true,
		onHidden,
		onShow,
	};


	const shouldShow = ({ editor }: { editor: Editor }) => {
		return editor.view.state.selection.content().size > 0;
	};
	
	onMount(() => {
		const plugin = BubbleMenuPlugin({
			pluginKey,
			editor,
			element,
			tippyOptions,
			shouldShow,
			updateDelay
		});

		editor.registerPlugin(plugin);
	});

	onDestroy(() => {
		editor.unregisterPlugin(pluginKey);
	});
</script>

<div id={pluginKey} bind:this={element} class="rz-bubble-menu">
	
	{#if nodes && nodes.length}
		<NodeSelector {editor} {nodes} isMenuOpen={isOpen} />
	{/if}

	{#if marks && marks.length}
		<Marks {editor} {marks} />
	{/if}

	{#if extras && extras.components?.length}
		{#each extras.components as Extra}
			<Extra {editor} isMenuOpen={isOpen} />
		{/each}
	{/if}

</div>
