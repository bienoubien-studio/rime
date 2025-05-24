<script lang="ts">
	import { getContext } from 'svelte';
	import type { CollectionContext } from '$lib/panel/context/collection.svelte';
	import { ListChecks, SquareCheck, SquareMinus, Trash } from '@lucide/svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { t__ } from '$lib/core/i18n/index.js';

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const isAllSelected = $derived(collection.selected.length === collection.docs.length);
	const selectedCount = $derived(collection.selected.length);
	const pluralSuffix = $derived(selectedCount > 1 ? 's' : '');
	const activeListClass = $derived(collection.selectMode ? 'rz-header-select__icon--active' : '');
</script>

<div class="rz-header-select">
	<Button
		size="icon-sm"
		variant="ghost"
		onclick={() => (collection.selectMode = !collection.selectMode)}
		disabled={collection.length === 0}
	>
		<ListChecks size={17} class="rz-header-select__icon {activeListClass}" />
	</Button>

	{#if collection.selectMode}
		{#if isAllSelected}
			<Button variant="text" icon={SquareMinus} onclick={() => (collection.selected = [])}>
				Deselect All
			</Button>
		{:else}
			<Button variant="text" icon={SquareCheck} onclick={collection.selectAll}>
				{t__('common.select_all')}
			</Button>
		{/if}
		<Button
			disabled={selectedCount === 0}
			icon={Trash}
			variant="text"
			onclick={collection.deleteSelection}
		>
			{t__('common.delete', `${selectedCount} doc${pluralSuffix}`)}
		</Button>
	{/if}
</div>

<style type="postcss" global>
	.rz-header-select {
		display: flex;
		align-items: center;
	}
</style>
