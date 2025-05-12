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
	import type { GenericBlock, GenericDoc } from '$lib/types/doc.js';
	import type { BlocksProps } from './props.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { env } from '$env/dynamic/public';
	import { getValueAtPath, omit, omitId } from 'rizom/util/object';
	import type { Dic } from 'rizom/types/util';
	import { random } from 'rizom/util';

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

	async function getDefaultLocaleContent(): Promise<void> {
		const result = await fetch(`${env.PUBLIC_RIZOM_URL}/api/${form.config.slug}/?where[id][equals]=${form.doc.id}&select=${path}&locale=${locale.defaultCode}`)
			.then(r => r.json())
		if(result.docs && Array.isArray(result.docs) && result.docs.length){
			const document = result.docs[0]
			const defaultLocaleBlocks = getValueAtPath<Dic[]>(path, document) || []
			
			// Recursively remove id property from blocks
			const removeIds = <T>(data: T): T => {
				if (!data) return data;
				
				// Handle arrays
				if (Array.isArray(data)) {
					return data.map(item => removeIds(item)) as unknown as T;
				}
				
				// Handle objects
				if (typeof data === 'object' && data !== null) {
					// First omit the id and locale properties
					const withoutId = omit(['id', 'locale'], data as Dic);
					let result: Dic = { ...withoutId, id: 'temp-' + random.randomId(8) };
					if(locale.code && 'locale' in data){
						result.locale = locale.code
					}
					// Then recursively process all remaining properties
					for (const key in result) {
						if (key !== 'id' && typeof result[key] === 'object' && result[key] !== null) {
							result[key] = removeIds(result[key]);
						}
					}
					
					return result as unknown as T;
				}
				
				// Return primitive values as is
				return data;
			};
			
			// Remove ids from blocks before setting the value
			field.value = removeIds(defaultLocaleBlocks);
		}
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
				{#if locale && config.localized}
					<Button onclick={getDefaultLocaleContent} variant="secondary" size="xs">get content from {locale.defaultCode}</Button>
				{/if}
				<Button onclick={collapseAll} variant="link">Collapse all</Button>
				<Button onclick={expandAll} variant="link">Expand all</Button>
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

	<AddBlockButton
		addBlock={add}
		class="rz-blocks__add-button"
		size={nested ? 'sm' : 'default'}
		{config}
	/>
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
</style>
