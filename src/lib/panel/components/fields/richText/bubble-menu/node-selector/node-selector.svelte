<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import { Check, ChevronDown } from 'lucide-svelte';
	import { createNodesState } from './node-selector-state.svelte';
	import * as Popover from '$lib/panel/components/ui/popover';
	import './node-selector.css';

	type Props = { editor: Editor; isOpen: boolean };
	let { editor, isOpen = $bindable() }: Props = $props();
	const nodesState = createNodesState(editor);

	// let isOpen = $state(false);

	function onTriggerClick(e: MouseEvent) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		isOpen = !isOpen;
	}

	$inspect(isOpen);
</script>

<Popover.Root controlledOpen open={isOpen}>
	<Popover.Trigger class="rz-node-selector__trigger" type="button" onclick={onTriggerClick}>
		<p>{nodesState.activeItem.label}</p>
		<ChevronDown size={16} />
	</Popover.Trigger>

	<Popover.Content align="start" class="rz-node-selector__content">
		{#each nodesState.items as item (item.name)}
			{@const ItemIcon = item.icon}
			<button
				onclick={() => {
					item.command();
					isOpen = false;
				}}
				class="rz-node-selector__item"
				type="button"
			>
				<div class="rz-node-selector__item-content">
					<div class="rz-node-selector__item-icon">
						<ItemIcon size={15} />
					</div>
					<span>{item.label}</span>
				</div>

				{#if nodesState.activeItems.map((item) => item.name).includes(item.name)}
					<Check size={16} />
				{/if}
			</button>
		{/each}
	</Popover.Content>
</Popover.Root>
