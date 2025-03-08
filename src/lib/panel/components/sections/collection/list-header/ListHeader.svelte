<script lang="ts">
	import { capitalize } from '$lib/util/string.js';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import type { CollectionContext } from 'rizom/panel/context/collection.svelte';
	import type { FormField } from 'rizom/types/fields';

	type TableColumn = Partial<FormField> & { name: string; label?: string };
	type Props = { compact: boolean };

	const { compact }: Props = $props();

	const collection = getContext<CollectionContext>('rizom.collectionList');
	let gridTemplateColumn = $state('grid-template-columns: repeat(1, minmax(0, 1fr));');

	function sortBy(name: string) {
		collection.sortBy(name);
	}

	$effect(() => {
		const columnLength = collection.columns.length + 2;
		gridTemplateColumn = `grid-template-columns: repeat(${compact ? 1 : columnLength}, minmax(0, 1fr));`;
	});
</script>

{#snippet columnHeader(label: string)}
	<div class="rz-list-header__column">
		{capitalize(label)}
	</div>
{/snippet}

{#snippet sortableColumnHeader(column: TableColumn)}
	<div>
		<button
			onclick={() => sortBy(column.name)}
			aria-label="sort {column.name}"
			type="button"
			class="rz-list-header__sort-button"
		>
			{capitalize(column.label || column.name)}

			{#if collection.sortingBy === column.name && collection.sortingOrder === 'dsc'}
				<ChevronUp size={12} />
			{:else}
				<ChevronDown size={12} />
			{/if}
		</button>
	</div>
{/snippet}

<div style={gridTemplateColumn} class="rz-list-header">
	{@render sortableColumnHeader({ name: collection.config.asTitle })}

	{#if !compact}
		{#each collection.columns as column}
			{#if column.table.sort}
				{@render sortableColumnHeader(column)}
			{:else}
				{@render columnHeader(column.label || column.name)}
			{/if}
		{/each}

		{@render sortableColumnHeader({ name: 'updatedAt' })}
	{/if}
</div>

<style type="postcss">
	.rz-list-header {
		display: grid;
		height: var(--rz-size-14);
		width: calc(100% - var(--rz-size-10));
		align-items: center;
		border-bottom: var(--rz-border);
		margin-left: var(--rz-size-5);
		padding-left: var(--rz-size-3);
		padding-right: var(--rz-size-6);
		font-size: var(--rz-text-sm);
	}

	.rz-list-header__column {
		@mixin color ground-2;
		display: flex;
		align-items: center;
		gap: var(--rz-size-1);
	}

	.rz-list-header__sort-button {
		@mixin color ground-2;
		display: flex;
		align-items: center;
		gap: var(--rz-size-1);
	}
</style>
