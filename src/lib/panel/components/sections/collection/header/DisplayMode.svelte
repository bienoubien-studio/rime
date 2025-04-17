<script lang="ts">
	import { LayoutGrid, List, TextQuote } from '@lucide/svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { getContext } from 'svelte';
	import type { CollectionContext } from '$lib/panel/context/collection.svelte';

	const collection = getContext<CollectionContext>('rizom.collectionList');

	const listIconClass = $derived(collection.isList() ? 'rz-header-display-mode__icon--active' : '');
	const gridIconClass = $derived(collection.isGrid() ? 'rz-header-display-mode__icon--active' : '');
	const nestedIconClass = $derived(collection.isNested() ? 'rz-header-display-mode__icon--active' : '');
</script>

<div class="rz-header-display-mode">
	<Button size="icon-sm" variant="ghost" onclick={() => collection.display('list')}>
		<List size={17} class="rz-header-display-mode__icon {listIconClass}" />
	</Button>
	{#if collection.config.upload}
	<Button size="icon-sm" variant="ghost" onclick={() => collection.display('grid')}>
		<LayoutGrid size={17} class="rz-header-display-mode__icon {gridIconClass}" />
	</Button>
	{/if}
	{#if collection.config.nested}
	<Button size="icon-sm" variant="ghost" onclick={() => collection.display('nested')}>
		<TextQuote size={17} class="rz-header-display-mode__icon {nestedIconClass}" />
	</Button>
	{/if}
</div>

<style type="postcss" global>
	.rz-header-display-mode {
		display: flex;
		gap: var(--rz-size-2);

		:global(.rz-header-display-mode__icon--active) {
			color: hsl(var(--rz-color-primary));
		}
	}
</style>
