<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { Asterisk, Check, ChevronDown } from '@lucide/svelte';
	import * as Popover from '$lib/panel/components/ui/popover/index.js';
	import type { RichTextModifier } from 'rizom/fields/rich-text/core/types.js';
	import { onMount } from 'svelte';
	import './node-selector.css';

	type Props = { editor: Editor; isMenuOpen: boolean, nodes: RichTextModifier[] };
	let { editor, nodes, isMenuOpen }: Props = $props();

	let open = $state(false)
	
	let activeItems = $state<RichTextModifier[]>([])
	const activeItem = $derived(
		activeItems.length === 1
			? activeItems[0]
			: { name: 'Multiple', label: 'Multiple', icon: Asterisk }
	);

	const setActiveItems = () => {
		activeItems = nodes.filter((node) => node.isActive(editor));
	};	

	onMount(() => {
		editor.on('update', () => {
			setActiveItems();
		});
		setActiveItems()
	})

	$effect(() => {
		if(!isMenuOpen){
			open = false
		}
	})
	
</script>

<Popover.Root bind:open={open}>
	<Popover.Trigger class="rz-node-selector__trigger" type="button">
		<p>{activeItem.label}</p>
		<ChevronDown size={16} />
	</Popover.Trigger>

	<Popover.Content align="start" class="rz-node-selector__content">
		{#each nodes as node (node.name)}
			{@const ItemIcon = node.icon}
			<button
				onclick={() => {
					node.command(editor);
					open = false;
				}}
				class="rz-node-selector__node"
				type="button"
			>
				<div class="rz-node-selector__node-content">
					<div class="rz-node-selector__node-icon">
						<ItemIcon size={15} />
					</div>
					<span>{node.label}</span>
				</div>

				{#if activeItems.map((node) => node.name).includes(node.name)}
					<Check size={16} />
				{/if}
			</button>
		{/each}
	</Popover.Content>
</Popover.Root>
