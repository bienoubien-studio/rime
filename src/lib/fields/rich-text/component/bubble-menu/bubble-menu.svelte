<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import LinkSelector from './link-selector/link-selector.svelte';
	import NodeSelector from './node-selector/node-selector.svelte';
	import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
	import { onDestroy, onMount } from 'svelte';
	import { randomId } from '$lib/utils/random';
	import Marks from './marks/marks.svelte';
	import type { RichTextFieldMark, RichTextFieldNode } from 'rizom/fields/rich-text';
	import './bubble-menu.css';

	type Props = {
		editor: Editor;
		marks: RichTextFieldMark[];
		nodes: RichTextFieldNode[];
	};
	const { editor, marks, nodes }: Props = $props();

	let isNodeSelectorOpen = $state(false);
	let isLinkSelectorOpen = $state(false);
	let element: HTMLElement;
	let marksComponent: any = $state();
	let isLinkActive = $state(editor && editor.isActive('link'));

	const pluginKey = randomId(12);
	const updateDelay = 250;
	const tippyOptions = {
		moveTransition: 'transform 0.15s ease-out',
		zIndex: 50,
		hideOnClick: true,
		onShow: () => {
			marksComponent?.updateActiveMarks();
			isLinkActive = editor.isActive('link');
		},
		onHidden: () => {
			isNodeSelectorOpen = false;
			isLinkSelectorOpen = false;
		}
	};

	const shouldShow = ({ editor }: { editor: Editor }) => {
		return editor.view.state.selection.content().size > 0;
	};

	$effect(() => {
		if (isNodeSelectorOpen) {
			isLinkSelectorOpen = false;
		}
	});

	$effect(() => {
		if (isLinkSelectorOpen) {
			isNodeSelectorOpen = false;
		}
	});

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
	{#if nodes.length}
		<NodeSelector {editor} bind:isOpen={isNodeSelectorOpen} />
	{/if}

	{#if marks.length}
		<Marks {editor} {marks} bind:this={marksComponent} />
	{/if}

	{#if nodes.includes('a')}
		<LinkSelector active={isLinkActive} {editor} bind:isOpen={isLinkSelectorOpen} />
	{/if}
</div>
