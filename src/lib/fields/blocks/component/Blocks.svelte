<script lang="ts">
	import { capitalize } from '$lib/util/string.js';
	import AddBlockButton from './AddBlockButton.svelte';
	import Block from './Block.svelte';
	import { Field } from '$lib/panel/components/fields/index.js';
	import { useSortable } from '$lib/panel/util/Sortable.js';
	import { onDestroy } from 'svelte';
	import Sortable from 'sortablejs';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import type { BlocksFieldRaw } from '$lib/fields/blocks/index.js';
	import type { GenericBlock } from '$lib/types/doc.js';
	import type { BlocksProps } from './props.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';

	const { path, config, form }: BlocksProps = $props();

	let blockList: HTMLElement;

	const field = $derived(form.useField(path, config));
	const blockState = $derived(form.useBlocks(path));
	const hasBlocks = $derived(blockState.blocks && blockState.blocks.length);
	let sortingInitialized = $state(false);
	let sorting = $state(false);
	let sortableInstance = $state<any>(null);
	let blocksComponents: ReturnType<typeof Block>[] = $state([]);

	const locale = getLocaleContext();

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

	function getConfigByBlockType(type: string, block: any): BlocksFieldRaw['blocks'][number] {
		const blockConfig = config.blocks.find((b) => type === b.name);
		if (!blockConfig) {
			throw new Error(`Block configuration not found for type: ${type}`);
		}
		return blockConfig;
	}

	function collapseAll() {
		blocksComponents.forEach((comp) => comp.setCollapse(true));
	}
	function expandAll() {
		blocksComponents.forEach((comp) => comp.setCollapse(false));
	}
	
	onDestroy(() => {
		if (sortableInstance) sortableInstance.destroy();
	});
</script>

<fieldset class="rz-field-blocks {config.className || ''}" use:root={field}>
	<Field.Error error={field.error} />

	<header class="rz-blocks__header">
		<h3 class="rz-blocks__title" class:rz-blocks__title--nested={nested || form.isLive}>
			{config.label ? config.label : capitalize(config.name)}
			{#if config.localized}
				<sup>{locale.code}</sup>
			{/if}
		</h3>

		{#if hasBlocks}
			<div class="rz-blocks__actions">
				<Button onclick={collapseAll} size="xs" variant="outline">Collapse all</Button>
				<Button onclick={expandAll} size="xs" variant="outline">Expand all</Button>
			</div>
		{/if}
	</header>

	<div class="rz-blocks__list" data-empty={!hasBlocks ? '' : null} bind:this={blockList}>
		{#if hasBlocks}
			{#each blockState.blocks as block, index (block.id)}
				<Block
					bind:this={blocksComponents[index]}
					deleteBlock={() => blockState.deleteBlock(index)}
					duplicateBlock={() => blockState.duplicateBlock(index)}
					{form}
					{sorting}
					path="{path}.{index}"
					config={getConfigByBlockType(block.type, block)}
				/>
			{/each}
		{/if}
	</div>

	<div class="rz-blocks__actions-bottom">
		<AddBlockButton
			addBlock={add}
			class="rz-blocks__add-button"
			size={nested ? 'sm' : 'default'}
			{config}
		/>
		
		{#if locale && locale.code !== locale.defaultCode && config.localized}
			<Button onclick={field.setValueFromDefaultLocale} variant="secondary">
				Get <span class="uz-upper">{locale.defaultCode}</span> data
			</Button>
		{/if}
	</div>

</fieldset>

<style lang="postcss">
	.rz-blocks__title {
		margin-bottom: var(--rz-size-4);
		font-size: var(--rz-text-xl);
		@mixin font-medium;
	}

	sup {
		font-size: var(--rz-text-2xs);
		text-transform: uppercase;
	}

	.rz-blocks__actions {
		translate: 0 calc(-1 * var(--rz-size-2));
	}

	.rz-blocks__title--nested {
		font-size: var(--rz-text-sm);
	}

	.rz-blocks__list {
		display: grid;
		gap: var(--rz-size-4);

		&:not([data-empty]) {
			margin-bottom: var(--rz-size-4);
		}
	}

	.rz-blocks__header {
		display: flex;
		justify-content: space-between;
	}
	.rz-blocks__actions-bottom{
		display: flex;
		gap: var(--rz-size-3);
		align-items: center;
	}

</style>
