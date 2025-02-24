<script lang="ts">
	import { capitalize } from '$lib/utils/string.js';
	import AddBlockButton from './AddBlockButton.svelte';
	import Block from './Block.svelte';
	import { Field } from 'rizom/panel';
	import { useSortable } from '$lib/panel/utility/Sortable';
	import type { BlocksFieldRaw } from 'rizom/fields/blocks';
	import type { GenericBlock } from 'rizom/types/doc';
	import type { BlocksProps } from './props.js';
	import './blocks.css';
	import { onDestroy } from 'svelte';
	import Sortable from 'sortablejs';

	const { path, config, form }: BlocksProps = $props();

	let blockList: HTMLElement;

	const field = $derived(form.useField(path, config));
	const blockState = $derived(form.useBlocks(path));
	const hasBlocks = $derived(blockState.blocks && blockState.blocks.length);
	let sortingInitialized = $state(false);
	let sorting = $state(false);
	let sortableInstance = $state<any>(null);

	const sortableOptions: Sortable.Options = {
		handle: '.rz-block__grip',
		group: path,
		animation: 150,
		onStart: () => (sorting = true),
		onUnchoose: () => (sorting = false),
		onEnd: function (evt) {
			const { oldIndex, newIndex } = evt;
			if (oldIndex !== undefined && newIndex !== undefined) {
				blockState.moveBlock(oldIndex, newIndex);
			}
			sorting = false;
		}
	};

	const nested = $derived(path.split('.').length > 1);

	const add = (options: Omit<GenericBlock, 'id' | 'path'>) => {
		blockState.addBlock({
			...options,
			position: blockState.blocks.length
		});
	};

	const shouldInit = $derived(!sortingInitialized && blockState.blocks.length > 0);
	const { sortable } = useSortable(sortableOptions);

	$effect(() => {
		if (shouldInit) {
			sortableInstance = sortable(blockList);
			sortingInitialized = true;
		}
	});

	function getConfigByBlockType(type: string): BlocksFieldRaw['blocks'][number] {
		const blockConfig = config.blocks.find((b) => type === b.name);
		if (!blockConfig) {
			throw new Error(`Block configuration not found for type: ${type}`);
		}
		return blockConfig;
	}

	onDestroy(() => {
		if (sortableInstance) sortableInstance.destroy();
	});
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Error error={field.error} />

	<h3 class="rz-blocks__title" class:rz-blocks__title--nested={nested || form.isLive}>
		{config.label ? config.label : capitalize(config.name)}
	</h3>

	<div class="rz-blocks__list" data-empty={!hasBlocks ? '' : null} bind:this={blockList}>
		{#if hasBlocks}
			{#each blockState.blocks as block, index (block.id)}
				<Block
					deleteBlock={() => blockState.deleteBlock(index)}
					duplicateBlock={() => blockState.duplicateBlock(index)}
					{form}
					{sorting}
					path="{path}.{index}"
					config={getConfigByBlockType(block.type)}
				/>
			{/each}
		{/if}
	</div>

	<AddBlockButton
		addBlock={add}
		class="rz-blocks__add-button"
		size={nested ? 'sm' : 'default'}
		{config}
	/>
</Field.Root>
