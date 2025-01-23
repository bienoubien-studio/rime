<script lang="ts">
	import { getContext, setContext } from 'svelte';
	import GridItem from './grid-item/GridItem.svelte';
	import ListRow from './list-row/ListRow.svelte';
	import ListHeader from './list-header/ListHeader.svelte';
	import Header from './header/Header.svelte';
	import ScrollArea from '$lib/panel/components/ui/scroll-area/scroll-area.svelte';
	import { getCollectionContext } from 'rizom/panel/context/collection.svelte';
	import { page } from '$app/stores';
	import type { PrototypeSlug } from 'rizom/types/doc';

	interface Props {
		compact?: boolean;
		slug: PrototypeSlug;
	}

	const { slug, compact = false }: Props = $props();
	// Get the shared title context
	const title = getContext<{ value: string }>('title');
	// Get the collection context based on the collection slug
	// assign it to the a shared collectionList context to avoid
	// passing the slug to children
	const collection = getCollectionContext(slug);
	setContext('collectionList', collection);
	// Retrieve current document if one active
	let currentDoc = $derived($page.params.id || null);
	// Define layout class display
	const gridClass = $derived(collection.isGrid() ? 'rz-scroll-area--grid' : '');
	// Set shared title to the current collection title
	title.value = collection.title;

	//
</script>

<div class="rz-collection-area">
	<div class="rz-collection-area__header">
		<Header {compact} />

		{#if collection.isList()}
			<ListHeader {compact} />
		{/if}
	</div>

	<ScrollArea class={gridClass}>
		<div class:rz-collection-area__grid={collection.isGrid()}>
			{#each collection.docs as doc}
				{@const checked = collection.selected.includes(doc.id)}
				{@const active = currentDoc === doc.id}
				{#if collection.isList()}
					<ListRow {doc} {checked} {compact} {active} />
				{:else}
					<GridItem {doc} {checked} />
				{/if}
			{/each}
		</div>
	</ScrollArea>
</div>

<style type="postcss">
	.rz-collection-area {
		height: 100vh;
		width: 100%;
		overflow-y: scroll;
		text-align: left;
		& :global(.rz-scroll-area) {
			height: calc(100vh - 7.5rem);
			width: 100%;
		}
		& :global(.rz-scroll-area--grid) {
			height: calc(100vh - 4rem);
		}
	}

	.rz-collection-area__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: var(--rz-size-6);
		padding: var(--rz-size-6);
	}
</style>
