<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import NodeSelector from './node-selector/node-selector.svelte';
	import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu';
	import { onDestroy, onMount } from 'svelte';
	import IconButton from './icon-button/icon-button.svelte';
	import './bubble-menu.css';
	import { getRichTextContext } from '../context.svelte';
	import type { RichTextFeature } from '../../core/types.js';

	type Props = {
		editor: Editor;
		features: RichTextFeature[];
		path: string;
	};

	const { editor, path, features = [] }: Props = $props();

	let element: HTMLElement;
	let isOpen = $state(false);

	// Get all node selector items from features
	const nodeItems = $derived(
		features.flatMap((feature) => feature.nodes || []).filter((node) => !!node.nodeSelector)
	);

	// Get all items with bubble menu components (both nodes and marks)
	const bubbleMenuItems = $derived([
		...features.flatMap((feature) => feature.marks || []).filter((mark) => !!mark.bubbleMenu),
		...features.flatMap((feature) => feature.nodes || []).filter((node) => !!node.bubbleMenu)
	]);

	const pluginKey = path;
	const updateDelay = 250;
	const richTextContext = getRichTextContext(path)

	const onShow = () => {
		richTextContext.bubbleOpen = true
		isOpen = true;
	};

	const onHidden = () => {
		richTextContext.bubbleOpen = false
		isOpen = false;
	};

	const tippyOptions = {
		moveTransition: 'transform 0.15s ease-out',
		zIndex: 50,
		hideOnClick: true,
		onHidden,
		onShow
	};

	const shouldShow = ({ editor }: { editor: Editor }) => {
		return (
			editor.view.state.selection.$head.depth > 0 && editor.view.state.selection.content().size > 0
		);
	};

	function setActiveItems () {
		activeItems = bubbleMenuItems.reduce(
				(acc, item) => {
					acc[item.name] = item.isActive?.({ editor }) || false;
					return acc;
				},
				{} as Record<string, boolean>
			);
	}

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
		editor.on('selectionUpdate', setActiveItems);
		// editor.on('update', setActiveItems);
		setActiveItems()
	});

	onDestroy(() => {
		editor.off('selectionUpdate', setActiveItems);
		// editor.off('update', setActiveItems);
		editor.unregisterPlugin(pluginKey);
	});

	let activeItems = $state<Record<string, boolean>>({});
	
</script>

<div id={pluginKey} bind:this={element} class="rz-bubble-menu">
	{#if nodeItems.length > 1}
		<NodeSelector {editor} items={nodeItems} isMenuOpen={isOpen} />
	{/if}

	{#if bubbleMenuItems.length > 0}
		{#each bubbleMenuItems as item, index (index)}
			{#if item.bubbleMenu && item.bubbleMenu.component}
				{@const FeatureComponent = item.bubbleMenu.component}
				<FeatureComponent active={activeItems[item.name]} {editor} {path} context={richTextContext} />
			{:else if item.bubbleMenu?.command}
				<IconButton
					active={activeItems[item.name]}
					icon={item.icon}
					onclick={() => {
						item.bubbleMenu?.command?.({ editor });
						// Update active state after command execution
						activeItems[item.name] = item.isActive?.({ editor }) || false;
					}}
				/>
			{/if}
		{/each}
	{/if}
</div>
